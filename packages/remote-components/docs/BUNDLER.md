# Remote components bundler

The component bundler and the `bundle` input of `createRemoteComponent` and `updateRemoteComponent`.

## Bundling outside the API

`@webiny/remote-components/exports/api/bundler.js` exports the bundler the API uses, for Node code that generates components and creates them with a bundle. It is server only.

```ts
import { bundleComponent } from "@webiny/remote-components/exports/api/bundler.js";

const result = await bundleComponent({ name: "Custom/Hero", source, css });
// result.bundled, result.sha256, result.css, result.cssSha256, result.manifest
```

`bundleComponent({ name, source, css? })` validates the source, derives the module from its AST, bundles it with esbuild-wasm and returns:

- `bundled`: the IIFE that defines `__remoteComponent__.createComponent`
- `css`: the CSS, scoped to the component's scope class, or `undefined`
- `sha256` and `cssSha256`: hex SHA-256 of `bundled` and `css`
- `manifest`: the manifest the bundle produces, as JSON, named after the component

The output is deterministic for the same name, source and CSS and the same package version. Module-level code is kept, the manifest can sit anywhere in the file, and object inputs can nest further inputs under `params.fields`.

esbuild's wasm binary ships gzipped next to the bundler (`api/bundler/esbuild.wasm.gz`) and is loaded on the first call, so no `node_modules` resolution is needed at runtime. The first call costs about 200 ms. The parser, CSS scoping and input factories are also loaded on first use, so an API bundle that never bundles doesn't load them.

The entry also exports:

- `validateComponentBundle(component, bundle)`: the check `createRemoteComponent` runs on a `bundle` input. It resolves to `{ valid, errors }`.
- `renderComponentMarkup(bundled, name, values)`: renders a bundle on the server with React and returns its markup, the text in it and the URLs its file inputs were given. `values` lays values over the component's own defaults, by input name.
- `buildComponentManifest(bundled, name)`, `validateComponentSource(source)` and `scopeClassName(name)`.

Bundles are evaluated in an empty `node:vm` context with a timeout, never with the process's globals in scope.

## Creating a component with a bundle

`createRemoteComponent` takes an optional `bundle`:

```graphql
mutation {
    remoteComponents {
        createRemoteComponent(
            data: {
                name: "Custom/Hero"
                label: "Hero"
                source: "..."
                css: "..."
                bundle: { bundledJs: "...", bundledCss: "...", manifest: "{...}" }
            }
        ) {
            data {
                id
                bundledJsSha256
            }
            error {
                code
                message
                data
            }
        }
    }
}
```

Pass `bundled` as `bundledJs`, `css` as `bundledCss` and `manifest` as `manifest`. The API checks, without bundling again:

- `bundledJs` evaluates and produces exactly `manifest` (key order doesn't matter);
- the manifest declares the inputs the source declares, by name, at every depth;
- when the component has CSS, `bundledCss` is present and scoped to the component's scope class.

A valid bundle is stored with hashes the API computes. An invalid one fails with `RemoteComponent/InvalidBundle`, and `error.data.errors` lists what failed. Without `bundle`, create behaves as before and stores no bundle.

`updateRemoteComponent` takes the same `bundle`, validated against the component as the update leaves it (the input's name, source and CSS where given, the stored ones otherwise). It can't be combined with the flat `bundledJs`, `bundledJsSha256`, `bundledCss` and `bundledCssSha256` fields, which the editor writes and which are stored as given, unchecked, as before.

## Scope class

The CSS scope class is `rc-` followed by the component name, lowercased, with `/` replaced by `-`. `sdk-frontend`'s `ComponentsSdk` and the editor's browser bundler use the same rule, so they have to change together.
