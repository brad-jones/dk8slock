import dayjs from "dayjs";
import { K8sLeaser } from "./lease/mod.ts";
import type { LockOptions } from "./options.ts";

/**
 * Creates a new Lease for the given name.
 *
 * This method will block until it has successfully created a Lease
 * or is canceled via a provided `AbortSignal`.
 */
export async function lock(name: string, options?: LockOptions) {
  const leaser = new K8sLeaser(options?.namespace);

  while (true) {
    if (options?.abortSignal && options?.abortSignal.aborted) break;

    try {
      await leaser.createLease({
        name,
        duration: options?.leaseDurationSeconds,
        holder: options?.identity,
        abortSignal: options?.abortSignal,
      });
      break;
    } catch (e) {
      if (e instanceof Error && e.message.includes("409")) {
        const currentLease = await leaser.getLease({ name, abortSignal: options?.abortSignal });
        const leaseExpiration = dayjs(currentLease.spec.acquireTime)
          .add(currentLease.spec.leaseDurationSeconds, "seconds");

        if (leaseExpiration.isBefore(dayjs())) {
          await leaser.replaceLease({
            name,
            duration: options?.leaseDurationSeconds,
            holder: options?.identity,
            abortSignal: options?.abortSignal,
            resourceVersion: currentLease.metadata?.resourceVersion!,
          });
          break;
        }

        const waitTime = options?.waitMs ?? 1000;
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }
      throw e;
    }
  }
}
