# dk8slock

A distributed lock for deno powered by [K8s Leases](https://kubernetes.io/docs/concepts/architecture/leases).

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

## Known Issues

- `@cloudydeno/kubernetes-client` leaks resources, it doesn't seem to close HttpClients.

  ```
  error: Leaks detected:
  - An HTTP client was created during the test, but not closed during the test. Close the HTTP client by calling `httpClient.close()`.
  ```

  Hence why our tests currently set `sanitizeResources: false`
