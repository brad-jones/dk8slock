import { autoDetectClient, type RestClient } from "@cloudydeno/kubernetes-client";
import { CoordinationV1Api } from "@cloudydeno/kubernetes-apis/coordination.k8s.io/v1";
import type { LockOptions } from "./options.ts";

let _k8s: RestClient | undefined = undefined;

export function debugLog(msg: string) {
  if (Deno.env.has("DK8SLOCK_DEBUG")) {
    console.log(msg);
  }
}

export async function getK8sClient() {
  if (!_k8s) {
    debugLog(`getK8sClient: detecting kubeconfig from environment`);
    _k8s = await autoDetectClient();
  }
  return _k8s;
}

export async function getNamespace(options?: LockOptions) {
  const ns = options?.namespace ?? (await getK8sClient()).defaultNamespace;
  if (!ns) throw new Error(`unknown namespace`);
  return ns;
}

export function getIdentity(options?: LockOptions) {
  return options?.identity ?? Deno.hostname();
}

export async function getCoodinationClient(options?: LockOptions) {
  return new CoordinationV1Api(await getK8sClient())
    .namespace(await getNamespace(options));
}
