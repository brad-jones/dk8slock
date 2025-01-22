import { $ } from "zx";
import test from "node:test";
import * as os from "node:os";
import { equal } from "node:assert";
import { lock, unlock, disposeableLock } from "@brad-jones/dk8slock";

test("basic lock & unlock", async (t) => {
  // Create the lease
  await lock("MyLock4");

  // Assert that the lease exists
  const lease = await $`kubectl get lease my-lock-4 -o json`.json();
  equal(lease.metadata.name, "my-lock-4");
  equal(lease.spec.holderIdentity, os.hostname());

  // Delete the lease
  await unlock("MyLock4");

  // Assert that the lease was deleted
  const notFound = (await $`kubectl get lease my-lock-4`.quiet(true).nothrow().text()).replaceAll("\n", "");
  equal(notFound, `Error from server (NotFound): leases.coordination.k8s.io "my-lock-4" not found`);
});

test("lock should wait", async () => {
  // Create a lock
  await lock("MyLock5");

  // Start a second async flow
  let x = 1;
  const job = (async () => {
    await lock("MyLock5", { waitMs: 100 });
    x++;
  })();

  // Wait for a second & confirm that x is still 1
  await new Promise((r) => setTimeout(r, 200));
  equal(x, 1);

  // Unlocking the first lock should allow x to be incremented
  await unlock("MyLock5");
  await job;
  equal(x, 2);
});

const runningWorkers: string[] = [];

async function doSomeWork(instance: string) {
  await using _ = await disposeableLock("MyLock6", { waitMs: 100 });
  runningWorkers.push(instance);
  await new Promise((r) => setTimeout(r, 200));
  runningWorkers.pop();
}

test("disposeable lock should prevent concurrent running", async () => {
  const completedJobs: string[] = [];
  const jobs = Promise.all([doSomeWork("foo"), doSomeWork("bar")]);
  const job = (async () => {
    while (true) {
      equal(runningWorkers.length <= 1, true);
      if (runningWorkers[0] && !completedJobs.includes(runningWorkers[0])) {
        completedJobs.push(runningWorkers[0]);
      }
      if (completedJobs.length === 2) break;
      await new Promise((r) => setTimeout(r, 0));
    }
  })();
  await jobs;
  await job;
  equal(completedJobs.includes("foo"), true);
  equal(completedJobs.includes("bar"), true);
});
