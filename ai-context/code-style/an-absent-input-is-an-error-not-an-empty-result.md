# An Absent Input Is An Error, Not An Empty Result

When an input a step needs is missing, say so. Do not carry on and produce the empty answer, because
an empty answer is indistinguishable from a correct one and nothing downstream can tell them apart.

Degrading gracefully is often right — a stage that can still do most of its job should. That is a
decision about **control flow**, not about **volume**. Carry on _and_ log it as an error.

```ts
// Bad — a missing artifact silently turns the whole step into a no-op that reports success.
const segmentRef = context.upstream.sections;
const segment = segmentRef ? await read(segmentRef) : null;
for (const cluster of clusters) {
  const node = segment ? resolve(cluster) : null;
  if (node) {
    bindObservedValues(node, cluster.props);
  }
  // No node, no binding, no complaint. The stage finishes "done" having bound nothing.
}

// Good — same control flow, and it says what did not happen.
const segmentRef = stageEntry(context.run.stages, "segment")?.artifacts?.sections;
const segment = segmentRef ? await read(segmentRef) : null;
if (!segment) {
  await context.log.error({
    message: "No segment artifact reachable: image and link props will be planned with no values."
  });
}
for (const cluster of clusters) {
  const node = segment ? resolve(cluster) : null;
  if (node) {
    bindObservedValues(node, cluster.props);
  } else {
    await context.log.error({
      message: `No section node for "${cluster.name}"; its props stay empty.`
    });
  }
}
```

## Why this keeps earning its own rule

This project has now hit the same shape five times, and every instance cost real time because the
failure arrived wearing success:

- **A stage bound nothing at all.** Plan read the segment artifact from `context.upstream`, which
  holds only the _immediately previous_ stage's artifacts, so the key was always undefined. Written to
  carry on without it, the binding became a complete no-op and the stage reported done. Caught only by
  measuring the output: 0 of 11 image props bound.
- **A sandbox registered a component and never placed it.** The bundle hydrated, the CSS was injected,
  the screenshot came back blank, and every check called it a success, because the markup was the one
  thing nobody looked at.
- **An inject landed before hydration.** `postMessage` goes to whoever is listening at that moment, so
  the first announcement hit nothing and every component failed with a wait timeout that read as the
  component's fault.
- **A URL generator returned bare storage keys until initialised**, which are strings, so everything
  accepted them.
- **DynamoDB turned an empty string into `null`** on the way out, so an optional field came back as a
  type nobody had handled.

The common thread is not the bug, it is that **the result was shaped like the success case**: zero
props, a blank image, an empty string, a key that is still a string. A check on the shape passes. Only
a check on the _content_, or an error at the moment the input went missing, catches it.

## The test that follows from it

When writing the fallback, ask: _if this input were missing right now, what would the output look
like, and would anything say so?_ If the answer is "an empty result, and no", the fallback needs a
log line before it is finished — and a measurement of the output, not of the status, before it is
believed.
