import { $ } from "@david/dax";
import { assertArrayIncludes, assertEquals, assertLessOrEqual } from "@std/assert";
import { disposeableLock, lock, unlock } from "../src/mod.ts";

Deno.test("basic lock & unlock", { sanitizeResources: false }, async () => {
  // Create the lease
  await lock("MyLock1");

  // Assert that the lease exists
  const lease = await $`kubectl get lease my-lock-1 -o json`.json();
  assertEquals(lease.metadata.name, "my-lock-1");
  assertEquals(lease.spec.holderIdentity, Deno.hostname());

  // Delete the lease
  await unlock("MyLock1");

  // Assert that the lease was deleted
  const notFound = await $`kubectl get lease my-lock-1`.noThrow().text("stderr");
  assertEquals(notFound, `Error from server (NotFound): leases.coordination.k8s.io "my-lock-1" not found`);
});

Deno.test("lock should wait", { sanitizeResources: false }, async () => {
  // Create a lock
  await lock("MyLock2");

  // Start a second async flow
  let x = 1;
  const job = (async () => {
    await lock("MyLock2", { waitMs: 100 });
    x++;
  })();

  // Wait for a second & confirm that x is still 1
  await new Promise((r) => setTimeout(r, 200));
  assertEquals(x, 1);

  // Unlocking the first lock should allow x to be incremented
  await unlock("MyLock2");
  await job;
  assertEquals(x, 2);
});

const runningWorkers: string[] = [];

async function doSomeWork(instance: string) {
  await using _ = await disposeableLock("MyLock3", { waitMs: 100 });
  runningWorkers.push(instance);
  await new Promise((r) => setTimeout(r, 200));
  runningWorkers.pop();
}

Deno.test("disposeable lock should prevent concurrent running", async () => {
  const completedJobs: string[] = [];
  const jobs = Promise.all([doSomeWork("foo"), doSomeWork("bar")]);
  const job = (async () => {
    while (true) {
      assertLessOrEqual(runningWorkers.length, 1);
      if (runningWorkers[0] && !completedJobs.includes(runningWorkers[0])) {
        completedJobs.push(runningWorkers[0]);
      }
      if (completedJobs.length === 2) break;
      await new Promise((r) => setTimeout(r, 0));
    }
  })();
  await jobs;
  await job;
  assertArrayIncludes(completedJobs, ["foo", "bar"]);
});
