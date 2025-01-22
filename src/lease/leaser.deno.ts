import type { Lease, Leaser } from "./leaser.ts";
import { kebabCase } from "@mesqueeb/case-anything";
import { autoDetectClient } from "@cloudydeno/kubernetes-client";
import { MicroTime } from "@cloudydeno/kubernetes-apis/common.ts";
import { CoordinationV1Api } from "@cloudydeno/kubernetes-apis/coordination.k8s.io/v1";
import type { CoordinationV1NamespacedApi } from "@cloudydeno/kubernetes-apis/coordination.k8s.io/v1";

export class K8sLeaser implements Leaser {
  #client: Promise<CoordinationV1NamespacedApi>;

  constructor(namespace?: string) {
    this.#client = (async () => {
      const client = await autoDetectClient();
      return new CoordinationV1Api(client)
        .namespace(namespace ?? client.defaultNamespace ?? "default");
    })();
  }

  async getLease(
    { name, abortSignal }: {
      name: string;
      abortSignal?: AbortSignal;
    },
  ): Promise<Lease> {
    const lease = await (await this.#client).getLease(kebabCase(name), { abortSignal });
    return {
      apiVersion: lease.apiVersion,
      kind: lease.kind,
      metadata: lease.metadata,
      spec: {
        acquireTime: lease.spec?.acquireTime?.baseDate.valueOf() ?? 0,
        holderIdentity: lease.spec?.holderIdentity ?? "",
        leaseDurationSeconds: lease.spec?.leaseDurationSeconds ?? 0,
        leaseTransitions: lease.spec?.leaseTransitions ?? 0,
        renewTime: lease.spec?.renewTime?.baseDate.valueOf() ?? 0,
      },
    };
  }

  async createLease(
    { name, holder, duration, abortSignal }: {
      name: string;
      holder?: string;
      duration?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<void> {
    await (await this.#client).createLease({
      apiVersion: "coordination.k8s.io/v1",
      kind: "Lease",
      metadata: {
        name: kebabCase(name),
      },
      spec: {
        holderIdentity: holder ?? Deno.hostname(),
        acquireTime: new MicroTime(new Date(), 0),
        leaseDurationSeconds: duration ?? 3600,
      },
    }, {
      abortSignal,
    });
  }

  async replaceLease(
    { name, resourceVersion, holder, duration, abortSignal }: {
      name: string;
      resourceVersion: string;
      holder?: string;
      duration?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<void> {
    await (await this.#client).replaceLease(kebabCase(name), {
      apiVersion: "coordination.k8s.io/v1",
      kind: "Lease",
      metadata: {
        name: kebabCase(name),
        resourceVersion,
      },
      spec: {
        holderIdentity: holder ?? Deno.hostname(),
        acquireTime: new MicroTime(new Date(), 0),
        leaseDurationSeconds: duration ?? 3600,
      },
    }, {
      abortSignal,
    });
  }

  async deleteLease({ name, abortSignal }: { name: string; abortSignal?: AbortSignal }): Promise<void> {
    await (await this.#client).deleteLease(kebabCase(name), { abortSignal });
  }
}
