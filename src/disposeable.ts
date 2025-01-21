import { lock } from "./lock.ts";
import type { LockOptions } from "./options.ts";
import { unlock } from "./unlock.ts";

/**
 * Using the power of Disposeable we offer a lock & unlock in one.
 *
 * ```ts
 * Deno.test("test case 2", async () => {
 *   await using _ = await disposeableLock("test case 2");
 *   // Create & modify contentious resources here as you see fit...
 * });
 * ```
 *
 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
 */
export async function disposeableLock(name: string, options?: LockOptions): Promise<AsyncDisposable> {
  await lock(name, options);
  return {
    async [Symbol.asyncDispose]() {
      await unlock(name, options);
    },
  };
}
