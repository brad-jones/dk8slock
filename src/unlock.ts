import { K8sLeaser } from "./lease/mod.ts";
import type { LockOptions } from "./options.ts";

/**
 * Deletes a Lease of the given name.
 */
export async function unlock(name: string, options?: LockOptions) {
  try {
    await new K8sLeaser(options?.namespace).deleteLease({ name, abortSignal: options?.abortSignal });
  } catch (e) {
    if (e instanceof Error && e.message.includes("404")) {
      return;
    }
    throw e;
  }
}
