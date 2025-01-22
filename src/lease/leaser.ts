import type { ObjectMeta } from "@cloudydeno/kubernetes-apis/meta/v1";

export interface Lease {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMeta | null;
  spec: {
    acquireTime: number;
    holderIdentity: string;
    leaseDurationSeconds: number;
    leaseTransitions?: number;
    renewTime?: number;
  };
}

export interface Leaser {
  getLease(options: {
    name: string;
    abortSignal?: AbortSignal;
  }): Promise<Lease>;

  createLease(
    options: {
      name: string;
      holder?: string;
      duration?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<void>;

  replaceLease(
    options: {
      name: string;
      resourceVersion: string;
      holder?: string;
      duration?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<void>;

  deleteLease(options: {
    name: string;
    abortSignal?: AbortSignal;
  }): Promise<void>;
}
