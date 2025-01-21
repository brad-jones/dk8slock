# dk8slock

A distributed lock for deno (& other Js runtimes) powered by
[K8s Leases](https://kubernetes.io/docs/concepts/architecture/leases).

Inspired by:

- <https://github.com/jrhouston/k8slock>
- <https://www.acritelli.com/blog/kubernetes-leases>

## Quick Start

This uses the power of [Disposeables](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
to create a lock for the entire function.

```ts
import { disposeableLock } from "jsr:@brad-jones/dk8slock";

async function contentiousFunc() {
  await using _ = await disposeableLock("MyLock");
  // Anything you do here is guaranteed to be only executing by a single worker.
}
```
