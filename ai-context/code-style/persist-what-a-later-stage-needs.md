# Persist What A Later Stage Needs

A value measured or derived in one stage, and needed by a later one, goes on the artifact. Do not
compute it, use it locally, and let it fall out of scope — the later stage cannot ask for it back.

A pipeline artifact is the only channel between stages. Anything not written to it is gone, and the
stage that needed it carries on without it, producing output that looks complete.

```ts
// Bad — the resolution is computed, used for one local purpose, and dropped with the shape.
const shape = sectionShape(node, DESKTOP_WIDTH, lookup); // resolves colours -> theme token paths
const signature = structuralSignature(shape);
entries.push({ member, digest, shape, crop });           // `shape` is never persisted
// Plan, two stages later, has no idea which tokens this section's colours resolve to, and proposes
// bindings blind.

// Good — what a later stage needs is on the artifact it reads.
const shape = sectionShape(node, DESKTOP_WIDTH, lookup);
const member: ClusterMember = {
    …,
    // The resolution Plan needs to bind tokens to real colours, not a guess from the section's name.
    resolvedTokens: shape.tokens
};
```

## Why this keeps earning its own rule

Five times in this project, and each one cost a measured defect that no signal reported:

- **Image values.** `src` and `alt` are captured on every node and read by nothing, so every Image
  prop reached Generate empty and the model invented stock URLs — 27 of them, into the customer's
  library.
- **Type sizes.** `fontSize` and `lineHeight` are captured on every node and read by nothing, so the
  model wrote a house heading of ~2rem regardless of the section: 13 of 31 renders at exactly 33px
  behind sources from 31px to 60px.
- **Link values.** Same shape, same cause.
- **Layout.** `textAlign`, `display`, `gap`, `paddingLeft`, `paddingTop`, `marginTop`, `position` and
  a box on every node, all captured, none read. `geometryClass` is _computed_ in Cluster and discarded
  with the shape.
- **Colour, the starkest.** `collectColors` resolves the section's colours against the theme into
  exactly the mapping Plan needs, uses it to build a clustering signature, and discards it. The model
  that picks the colour tokens cannot see the colours; the model that can see them receives those
  picks as instructions. Measured: 37% of rendered colours are theme colours the section does not
  have, against 1 invented in 204 — obedience to a wrong instruction, not disobedience.

The common thread is that the information was never missing. It was measured, correctly, and then not
carried. The stage downstream then does the only thing it can — guess — and a guess is indistinguishable
from a derivation in the output.

## The test that follows from it

When a stage computes something from the capture, ask: _does any later stage need this, and can it
recompute it?_ If a later stage needs it and cannot recompute it — because the tree, the theme or the
browser is no longer in reach — it goes on the artifact. "It is used right here" is about this stage,
not about the pipeline.
