import { kebabCase } from "@mesqueeb/case-anything";
import type { LockOptions } from "./options.ts";
import { debugLog, getCoodinationClient, getNamespace } from "./utils.ts";

/**
 * Deletes a Lease of the given name.
 */
export async function unlock(name: string, options?: LockOptions) {
  const leaseName = `${await getNamespace(options)}/${kebabCase(name)}`;
  debugLog(`unlock: ${leaseName} - deleting lease`);

  try {
    await (await getCoodinationClient(options)).deleteLease(kebabCase(name), { abortSignal: options?.abortSignal });
    debugLog(`unlock: ${leaseName} - deleted`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("404 NotFound")) {
      debugLog(`unlock: ${leaseName} - not found`);
      return;
    }
  }
}
