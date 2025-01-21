import dayjs from "dayjs";
import { kebabCase } from "@mesqueeb/case-anything";
import { MicroTime } from "@cloudydeno/kubernetes-apis/common.ts";
import type { Lease } from "@cloudydeno/kubernetes-apis/coordination.k8s.io/v1";
import { debugLog, getCoodinationClient, getIdentity, getNamespace } from "./utils.ts";
import type { LockOptions } from "./options.ts";

/**
 * Creates a new Lease for the given name.
 *
 * This method will block until it has successfully created a Lease
 * or is canceled via a provided `AbortSignal`.
 */
export async function lock(name: string, options?: LockOptions) {
  const coodination = await getCoodinationClient(options);

  while (true) {
    if (options?.abortSignal && options?.abortSignal.aborted) break;

    const lease: Lease = {
      apiVersion: "coordination.k8s.io/v1",
      kind: "Lease",
      metadata: {
        name: kebabCase(name),
        namespace: await getNamespace(options),
      },
      spec: {
        holderIdentity: getIdentity(options),
        acquireTime: new MicroTime(new Date(), 0),
        leaseDurationSeconds: options?.leaseDurationSeconds ?? 3600,
      },
    };

    const leaseName = `${lease.metadata?.namespace}/${lease.metadata?.name}`;

    try {
      // If we can just create the lease and move on then job done
      debugLog(`lock: ${leaseName} - attempting to create lease - ${JSON.stringify(lease, null, 2)}`);
      await coodination.createLease(lease, { abortSignal: options?.abortSignal });
      debugLog(`lock: ${leaseName} - created lease`);
      break;
    } catch (e) {
      if (e instanceof Error && e.message.includes("409 AlreadyExists")) {
        debugLog(`lock: ${leaseName} - failed to create lease because it already exists`);

        // Otherwise if K8s tells us the lease already exists, lets check it's expiration
        const currentLease = await coodination.getLease(kebabCase(name), { abortSignal: options?.abortSignal });
        const leaseExpiration = dayjs(currentLease.spec!.acquireTime!.baseDate)
          .add(currentLease.spec!.leaseDurationSeconds!, "seconds");

        debugLog(`lock: ${leaseName} - lease expires @ ${leaseExpiration.toISOString()}`);

        // Take over the lease if it has expired
        if (leaseExpiration.isBefore(dayjs())) {
          const newLease: Lease = {
            apiVersion: "coordination.k8s.io/v1",
            kind: "Lease",
            metadata: {
              name: kebabCase(name),
              namespace: await getNamespace(options),
              resourceVersion: currentLease.metadata?.resourceVersion,
            },
            spec: {
              holderIdentity: getIdentity(options),
              acquireTime: new MicroTime(new Date(), 0),
              leaseDurationSeconds: options?.leaseDurationSeconds ?? 3600,
            },
          };
          debugLog(`lock: ${leaseName} - lease expired, hostile takeover - ${JSON.stringify(newLease, null, 2)}`);
          await coodination.replaceLease(kebabCase(name), newLease, { abortSignal: options?.abortSignal });
          debugLog(`lock: ${leaseName} - replaced lease`);
          break;
        }

        // Wait for a bit before trying to create the lease again
        const waitTime = options?.waitMs ?? 1000;
        debugLog(`lock: ${leaseName} - waiting for ${waitTime}ms until trying to create again`);
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }
      throw e;
    }
  }
}
