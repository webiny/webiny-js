# Check-then-act on shared state, twice

> **Package:** `@webiny/api-component-extraction`, `@webiny/site-capture`
> **Severity:** low as a record, and the second instance is fixed. Filed because the shape has now
> appeared twice and the run-lock decision is still open.

## The shape

A value is **read**, a decision is made from it, and the value is **written** afterwards. Between the
read and the write, something else does the same thing, and both decide as though they were alone.

Nothing about it is exotic. It is worth a file only because it has now happened twice in this feature
in two unrelated places, which suggests the next place is worth looking for rather than waiting for.

## Instance 1 — the run lock (open, not this pass's decision)

`createRun` asks the lock whether a run is in flight, and `markStageDone` sets status independently.
The two are separate reads and writes of the same shared fact, so "is there a run in flight" can be
answered from a state that has already moved.

**Not specified here.** The lock invariant is an owned decision with consequences beyond this
feature; this file only records that the second instance below is the same shape, for whoever picks
that decision up.

## Instance 2 — the image collector's concurrency bound (fixed)

The per-page image collector limits how many response bodies it reads at once. It was written as:

```ts
const waitForSlot = async () => {
  while (inFlight >= limit) {
    await Promise.race([...pending]);
  }
};
// ...
await waitForSlot();
inFlight++; // <- the write, several awaits after the read
```

Every caller that reaches `waitForSlot` while `inFlight` is below the limit passes it, and they all
pass before any of them increments. Measured with a test: **eight concurrent offers against a limit
of two ran all eight at once.** The bound silently did not exist.

The fix is a semaphore that creates a slot only when one is free and, on release, **hands** it to the
next waiter rather than freeing it to be re-contended:

```ts
const acquire = async () => {
  if (active < limit) {
    active++;
    return;
  } // the slot is taken in the same tick as the check
  await new Promise<void>(resolve => waiting.push(resolve));
};

const release = () => {
  const next = waiting.shift();
  if (next) {
    next();
    return;
  } // transferred, count unchanged
  active--;
};
```

## What is worth carrying over

The bug was invisible until something asked for the invariant directly. A test that ran eight offers
and asserted the peak found it immediately; nothing about reading the code did, and no functional
test would have, because the output is correct either way — only the resource bound is violated.

So for the lock: whatever invariant it is given, it wants a test that exercises the concurrent case
and asserts the invariant, not one that asserts the happy path still works.
