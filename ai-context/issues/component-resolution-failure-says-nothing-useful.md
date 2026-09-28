# A component that fails to load or resolve says nothing useful about why

> **Package:** `@webiny/sdk-frontend`, `@webiny/website-builder-sdk`
> **Severity:** medium — nothing is broken by it, but it is what made a one-line name mismatch take a
> full investigation, and it will hide the next one the same way.

## Two places that fail by producing nothing

### 1. `hydrateComponent` returns `null` on a path that logs nothing

`ComponentsSdk.hydrateComponent` has two failure exits. One logs:

```ts
} catch (error) {
    console.error(`[ComponentsSdk] Failed to hydrate component "${entry.name}":`, error);
    return null;
}
```

The other does not:

```ts
const component = mod.createComponent(runtimeSdk);
if (!component) {
  return null; // no log, no reason, no name
}
```

Callers then discard the nulls without counting them. The website starter does:

```ts
const hydrated = remoteComponents
  .map(entry => sdk.components.hydrateComponent(entry, { sdk: sdkNextjs, React }))
  .filter(Boolean);
```

So a component that fails to hydrate on the silent path leaves **no trace anywhere**: not an error,
not a warning, not a count. The only visible symptom is the unrelated-looking "Unknown component"
warning later, from a different package, naming a component nobody said had failed.

This is the same shape as two defects already filed in this project —
[an empty string round-tripping to null](./dynamodb-cannot-round-trip-an-empty-string.md) and
[a url generator returning bare storage keys](./file-url-generator-returns-bare-keys-until-init.md).
All three fail by producing nothing rather than by failing.

### 2. The resolver says what it wanted, never what it has

`ComponentResolver.resolve`:

```ts
logger.warn(`Unknown component: ${componentName}`);
```

It knows the registry. It could say "…; 199 components are registered, the closest names are X, Y, Z"
and a name mismatch would be obvious on sight. As written, "unknown" is indistinguishable between
"nothing was registered at all", "the registry has it under a different name" and "hydration dropped
it" — which are three different bugs with three different fixes, and the investigation had to
separate them by hand.

## Where the fix belongs

**In the SDK, not in the app.** Specifically:

- `hydrateComponent`'s silent exit belongs in `@webiny/sdk-frontend`. Returning `null` for two
  different reasons is the API shape that forces every consumer to invent its own `.filter(Boolean)`
  and lose the reason. Returning a `Result` — the pattern this codebase already uses everywhere —
  would make the reason survive, and the starter's `.filter(Boolean)` would become a filter that can
  report what it dropped. At minimum, log on the `!component` path so the two exits behave alike.
- The resolver message belongs in `@webiny/website-builder-sdk`, beside the registry it can already
  see.

Putting either in the app would fix one app. Every other consumer — the editor, the sandbox, the
Next.js starter, anything built later — would each have to rediscover it, which is how this one was
found.

## What it would have saved

With either fix, the name mismatch in
[composed pages render no components](./composed-pages-render-no-components.md) would have announced
itself: "registered 199 components, none named `2424Tulane/FAQ Section`; did you mean
`Custom/FaqSection`?" Instead it took ruling out promotion, permissions, the fetch, hydration and an
SDK version mismatch first.
