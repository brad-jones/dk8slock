# dk8slock

A distributed lock for deno _(& other Js Runtimes)_ powered by [K8s Leases](https://kubernetes.io/docs/concepts/architecture/leases).

Inspired by:

- <https://github.com/jrhouston/k8slock>
- <https://www.acritelli.com/blog/kubernetes-leases>

## Quick Start

This uses the power of [Disposeables](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
to create a lock for the entire function.

### Deno

```ts
import { disposeableLock } from "jsr:@brad-jones/dk8slock";

async function contentiousFunc() {
  await using _ = await disposeableLock("MyLock");
  // Anything you do here is guaranteed to be only executing by a single worker.
}
```

### Node.js

Install the node package with your favorite package manager.\
`npm` used here but `pnpm`, `yarn` & others all work in much the same way.

`npm install @brad-jones/dk8slock`

_NB: Don't attempt to use the [JSR](https://jsr.io) package with Node.js it will not work!_

## Known Issues

- `@cloudydeno/kubernetes-client` leaks resources, it doesn't seem to close HttpClients.

  ```
  error: Leaks detected:
  - An HTTP client was created during the test, but not closed during the test. Close the HTTP client by calling `httpClient.close()`.
  ```

  Hence why our tests currently set `sanitizeResources: false`
