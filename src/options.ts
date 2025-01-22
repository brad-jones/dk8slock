export interface LockOptions {
  /**
   * Override the default namespace.
   */
  namespace?: string;

  /**
   * Any string that can identify the holder of the lock.
   *
   * Default: `Deno.hostname()`
   */
  identity?: string;

  /**
   * The number of milliseconds to wait before attempting to try
   * creating a new Lease in the event one already exists.
   *
   * Default: `1000`
   */
  waitMs?: number;

  /**
   * The number of seconds the lease is considered to be valid.
   *
   * The moment this time has elapsed, since creation,
   * the lease is considered invalid & available for
   * anyone else to use.
   *
   * Default: `3600` (or 1 hour)
   */
  leaseDurationSeconds?: number;

  /**
   * For use with AbortControllers.
   *
   * see: <https://developer.mozilla.org/en-US/docs/Web/API/AbortController>
   */
  abortSignal?: AbortSignal;
}
