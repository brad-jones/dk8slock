import type { Lease, Leaser } from "./leaser.ts";
import { kebabCase } from "@mesqueeb/case-anything";
import { CoordinationV1Api, KubeConfig, V1MicroTime } from "@kubernetes/client-node";

export class K8sLeaser implements Leaser {
  #kubeConfig: KubeConfig;
  #client: CoordinationV1Api;
  #namespace: string;

  constructor(namespace?: string) {
    this.#kubeConfig = new KubeConfig();
    this.#kubeConfig.loadFromDefault();
    this.#client = this.#kubeConfig.makeApiClient(CoordinationV1Api);
    this.#namespace = namespace ??
      this.#kubeConfig.getContextObject(this.#kubeConfig.getCurrentContext())?.namespace ??
      "default";
  }

  async getLease(
    { name }: {
      name: string;
      abortSignal?: AbortSignal;
    },
  ): Promise<Lease> {
    const lease = await this.#client.readNamespacedLease({ name: kebabCase(name), namespace: this.#namespace });
    return {
      apiVersion: lease.apiVersion,
      kind: lease.kind,
      metadata: lease.metadata,
      spec: {
        acquireTime: lease.spec?.acquireTime?.valueOf() ?? 0,
        holderIdentity: lease.spec?.holderIdentity ?? "",
        leaseDurationSeconds: lease.spec?.leaseDurationSeconds ?? 0,
        leaseTransitions: lease.spec?.leaseTransitions ?? 0,
        renewTime: lease.spec?.renewTime?.valueOf() ?? 0,
      },
    };
  }

  async createLease(
    { name, holder, duration }: {
      name: string;
      holder?: string;
      duration?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<void> {
    await this.#client.createNamespacedLease({
      namespace: this.#namespace,
      body: {
        apiVersion: "coordination.k8s.io/v1",
        kind: "Lease",
        metadata: {
          name: kebabCase(name),
        },
        spec: {
          holderIdentity: holder ?? Deno.hostname(),
          acquireTime: new V1MicroTime(),
          leaseDurationSeconds: duration ?? 3600,
        },
      },
    });
  }

  async replaceLease(
    { name, resourceVersion, holder, duration }: {
      name: string;
      resourceVersion: string;
      holder?: string;
      duration?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<void> {
    await this.#client.replaceNamespacedLease({
      name: kebabCase(name),
      namespace: this.#namespace,
      body: {
        apiVersion: "coordination.k8s.io/v1",
        kind: "Lease",
        metadata: {
          name: kebabCase(name),
          resourceVersion,
        },
        spec: {
          holderIdentity: holder ?? Deno.hostname(),
          acquireTime: new V1MicroTime(),
          leaseDurationSeconds: duration ?? 3600,
        },
      },
    });
  }

  async deleteLease({ name }: { name: string; abortSignal?: AbortSignal }): Promise<void> {
    await this.#client.deleteNamespacedLease({ name: kebabCase(name), namespace: this.#namespace });
  }
}
