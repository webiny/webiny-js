# Remote React Component Bundling and Next.js Loading Specification

## 1. Purpose

This document specifies how tenant-specific React components are:

1. compiled and bundled outside the Next.js application;
2. published to object storage;
3. discovered and loaded by a deployed Next.js application;
4. rendered during server-side rendering;
5. hydrated in the browser as isolated React islands.

The specification intentionally excludes:

- AI code generation;
- Figma integration;
- drag-and-drop page-builder behavior;
- tenant theme editing;
- component authoring workflows;
- SaaS administration workflows.

The scope begins with generated React source code and ends with a rendered, hydrated remote component inside Next.js.

---

## 2. Goals

The system must:

- support tenant-specific React components;
- allow components to be published after the Next.js host has been deployed;
- support server-side rendering;
- support browser hydration;
- avoid rebuilding the Next.js host for every component publication;
- prevent remote components from importing arbitrary host modules;
- inject a tightly controlled host SDK;
- provide isolated compiled CSS;
- support immutable, versioned bundles;
- verify bundle integrity before execution;
- cache manifests, bundles, and loaded modules;
- prevent one tenant from loading another tenant's components;
- support multiple components within one published component package.

---

## 3. Non-Goals

The system does not attempt to make remote components literal static imports in the Next.js build graph.

Remote components will not:

- participate in Next.js compile-time tree shaking;
- become native React Server Components;
- receive automatic Next.js client-reference metadata;
- be included in the host's initial JavaScript chunks;
- use arbitrary imports from the deployed Next.js project;
- share internal host state unless explicitly exposed through the SDK.

Remote interactive components are rendered and hydrated as isolated React roots.

---

## 4. High-Level Architecture

The solution consists of two parts.

### 4.1 Bundle Producer

A background bundling process receives generated component source code and produces:

- a server bundle;
- a browser bundle;
- an isolated CSS bundle;
- a signed manifest.

The artifacts are uploaded under immutable, tenant-scoped object-storage paths.

### 4.2 Next.js Remote Component Runtime

The deployed Next.js application:

1. resolves the tenant component manifest;
2. verifies that the tenant is authorized to use it;
3. fetches and verifies the server bundle;
4. imports the server bundle;
5. injects the server SDK;
6. renders the selected component to HTML;
7. emits a local client boundary containing the browser bundle location and serialized props;
8. loads the browser bundle in the browser;
9. injects the browser SDK;
10. hydrates the component as an isolated React root.

---

## 5. Terminology

### Component Package

A published collection of one or more tenant components built and versioned together.

### Bundle Version

An immutable identifier for one component package publication.

Recommended formats:

- semantic version;
- ULID;
- content hash;
- build timestamp plus content hash.

A content-addressed or ULID-based identifier is preferred over mutable semantic tags.

### Host SDK

A small, stable API implemented by the Next.js host and injected into remote component bundles.

### Server Bundle

An ESM bundle compiled for the Node.js runtime and used during SSR.

### Browser Bundle

An ESM bundle compiled for modern browsers and used for client hydration.

### Remote Island

A DOM subtree rendered by the Next.js server and hydrated using a separate React root in the browser.

---

## 6. Artifact Layout

Each published component package must use an immutable storage path.

```text
remote-components/
  tenants/
    {tenantId}/
      packages/
        {packageId}/
          versions/
            {version}/
              manifest.json
              server.mjs
              browser.mjs
              styles.css
              server.mjs.sig
              browser.mjs.sig
              styles.css.sig
```

Example:

```text
remote-components/
  tenants/
    tenant_01HXYZ/
      packages/
        marketing-components/
          versions/
            01J0ABCD1234/
              manifest.json
              server.mjs
              browser.mjs
              styles.css
              server.mjs.sig
              browser.mjs.sig
              styles.css.sig
```

No published artifact may be overwritten.

A mutable pointer may exist separately:

```text
remote-components/
  tenants/
    {tenantId}/
      packages/
        {packageId}/
          channels/
            production.json
            preview.json
```

A channel file may point to an immutable version, but immutable manifests and bundles must never change.

---

## 7. Source Package Contract

The bundler receives a normalized source package.

```ts
export interface RemoteComponentSourcePackage {
  tenantId: string;
  packageId: string;
  components: RemoteComponentSource[];
  sdkVersion: string;
  buildId: string;
}

export interface RemoteComponentSource {
  name: string;
  entryFile: string;
  files: Record<string, string>;
}
```

Each exported component must expose a stable factory function.

```ts
import type {
  RemoteComponentFactory,
  RemoteComponentProps,
} from "@remote-runtime/contracts";

export const createComponent: RemoteComponentFactory<RemoteComponentProps> = (
  sdk,
) => {
  return function HeroComponent(props) {
    return (
      <section>
        <h1>{props.title}</h1>
        <sdk.components.Button href={props.href}>
          {props.buttonLabel}
        </sdk.components.Button>
      </section>
    );
  };
};
```

Remote source code must not import React, React DOM, Next.js modules, or host application modules directly.

The bundler may transform JSX using an injected runtime, but the remote component contract must remain based on an SDK factory.

---

## 8. Bundle Export Contract

Both server and browser bundles must expose the same public module shape.

```ts
export interface RemoteBundleModule {
  metadata: RemoteBundleMetadata;
  createRegistry: RemoteRegistryFactory;
}

export interface RemoteBundleMetadata {
  packageId: string;
  version: string;
  tenantId: string;
  sdkVersion: string;
  componentNames: string[];
}

export type RemoteRegistryFactory = (
  sdk: RemoteRuntimeSdk,
) => RemoteComponentRegistry;

export type RemoteComponentRegistry = Record<
  string,
  React.ComponentType<Record<string, unknown>>
>;
```

Example generated bundle:

```ts
export const metadata = {
  packageId: "marketing-components",
  version: "01J0ABCD1234",
  tenantId: "tenant_01HXYZ",
  sdkVersion: "1",
  componentNames: ["Hero", "FeatureGrid"],
};

export function createRegistry(sdk) {
  return {
    Hero: createHero(sdk),
    FeatureGrid: createFeatureGrid(sdk),
  };
}
```

A package may contain one or more components.

The server and browser bundles must export identical component names.

---

## 9. Host SDK Contract

The host SDK must be explicit, versioned, and minimal.

```ts
export interface RemoteRuntimeSdk {
  version: "1";
  components: {
    Button: React.ComponentType<RemoteButtonProps>;
    Link: React.ComponentType<RemoteLinkProps>;
    Image: React.ComponentType<RemoteImageProps>;
  };
  utilities: {
    cx: (...values: Array<string | false | null | undefined>) => string;
    formatDate: (value: string, locale?: string) => string;
  };
  environment: {
    tenantId: string;
    locale: string;
    mode: "server" | "browser";
  };
}
```

The server and browser SDKs must implement the same public interface.

Environment-specific behavior may differ internally.

Remote code must not receive:

- database clients;
- cloud credentials;
- request objects;
- raw cookies;
- internal service containers;
- arbitrary module resolution;
- unrestricted network clients.

SDK compatibility must be validated before a bundle is executed.

---

## 10. Bundling Requirements

## 10.1 Build Targets

The bundler must produce two JavaScript artifacts.

### Server Target

Recommended configuration:

- platform: Node.js;
- module format: ESM;
- target: the exact Node.js version used by Next.js;
- JSX: automatic transform or equivalent;
- source maps: optional, stored separately;
- minification: optional;
- external Node built-ins: forbidden unless explicitly allowed.

### Browser Target

Recommended configuration:

- platform: browser;
- module format: ESM;
- target: modern supported browsers;
- code splitting: disabled for the first implementation;
- dynamic imports: forbidden unless the bundler collects every emitted chunk;
- Node.js built-ins: forbidden;
- source maps: optional;
- minification: enabled for production.

The initial implementation should produce exactly one server JavaScript file and one browser JavaScript file per package.

---

## 10.2 Dependency Policy

Remote components must not resolve arbitrary dependencies from the Next.js host.

Allowed dependency strategies:

1. dependencies are bundled into both remote artifacts;
2. selected capabilities are provided through the SDK;
3. explicitly approved libraries are injected through the bundle wrapper.

React and React DOM must not be bundled as private copies if the component will be hydrated against host-rendered markup.

The preferred approach is:

- JSX is compiled;
- React primitives are supplied by the runtime wrapper;
- host capabilities are supplied through the SDK;
- approved third-party libraries are either bundled or exposed through the SDK.

The bundler must reject:

- imports from `next/*`;
- imports from host-internal aliases;
- Node.js built-ins;
- unapproved package imports;
- absolute file imports;
- imports outside the submitted source package.

---

## 10.3 Import Validation

Before bundling, every import must be parsed and classified.

```ts
export interface ImportValidationResult {
  valid: boolean;
  violations: ImportViolation[];
}

export interface ImportViolation {
  file: string;
  specifier: string;
  reason: string;
}
```

The build must fail when a forbidden import is present.

Runtime import resolution must not be used as a fallback for unresolved imports.

---

## 10.4 CSS Compilation

Each component package must produce one isolated CSS file.

The CSS compiler must:

- process all component styles;
- resolve local style imports;
- apply vendor prefixes;
- minify production output;
- rewrite asset references;
- isolate selectors to the package scope.

Every remote island must receive a deterministic package scope.

Example scope:

```text
rc-tenant_01HXYZ-marketing-components-01J0ABCD1234
```

Generated CSS must be scoped beneath that selector.

```css
.rc-tenant_01HXYZ-marketing-components-01J0ABCD1234 .hero {
  display: grid;
}
```

The server-rendered root must include the same scope.

```html
<div
  class="rc-tenant_01HXYZ-marketing-components-01J0ABCD1234"
  data-remote-component-root
>
  ...
</div>
```

The first implementation should not use Shadow DOM because SSR and hydration integration are simpler with selector scoping.

---

## 10.5 Theme Tokens

Remote CSS should reference theme values through CSS custom properties rather than hard-coded tenant values.

```css
.hero {
  color: var(--wb-color-text-primary);
  background: var(--wb-color-surface-primary);
  padding: var(--wb-spacing-xl);
}
```

The host is responsible for placing the tenant token variables above the remote island.

The bundle must not need to be rebuilt when only token values change.

---

## 10.6 Asset Handling

Static assets imported by remote components must be:

- emitted under the immutable bundle version path;
- referenced by absolute CDN URLs;
- listed in the manifest;
- content-hashed.

The browser and server bundles must resolve identical asset URLs.

Inline assets should be limited by a configurable size threshold.

---

## 10.7 Deterministic Builds

Given identical:

- source files;
- bundler version;
- build configuration;
- SDK contract version;
- dependency lockfile;

the bundler should produce identical output hashes.

Build metadata that changes on every run must not be embedded into JavaScript unless required.

---

## 11. Manifest Contract

```ts
export interface RemoteComponentManifest {
  schemaVersion: "1";
  tenantId: string;
  packageId: string;
  version: string;
  sdkVersion: string;
  createdAt: string;
  components: RemoteComponentManifestEntry[];
  artifacts: {
    server: RemoteArtifact;
    browser: RemoteArtifact;
    css: RemoteArtifact;
  };
  scopeClassName: string;
  signature: ManifestSignature;
}

export interface RemoteComponentManifestEntry {
  name: string;
  propsSchema?: Record<string, unknown>;
}

export interface RemoteArtifact {
  url: string;
  sha256: string;
  size: number;
  contentType: string;
}

export interface ManifestSignature {
  algorithm: "Ed25519";
  keyId: string;
  value: string;
}
```

Example:

```json
{
  "schemaVersion": "1",
  "tenantId": "tenant_01HXYZ",
  "packageId": "marketing-components",
  "version": "01J0ABCD1234",
  "sdkVersion": "1",
  "createdAt": "2026-07-24T10:00:00.000Z",
  "components": [
    {
      "name": "Hero"
    },
    {
      "name": "FeatureGrid"
    }
  ],
  "artifacts": {
    "server": {
      "url": "https://cdn.example.com/.../server.mjs",
      "sha256": "abc123",
      "size": 48210,
      "contentType": "text/javascript"
    },
    "browser": {
      "url": "https://cdn.example.com/.../browser.mjs",
      "sha256": "def456",
      "size": 43810,
      "contentType": "text/javascript"
    },
    "css": {
      "url": "https://cdn.example.com/.../styles.css",
      "sha256": "ghi789",
      "size": 8291,
      "contentType": "text/css"
    }
  },
  "scopeClassName": "rc-tenant_01HXYZ-marketing-components-01J0ABCD1234",
  "signature": {
    "algorithm": "Ed25519",
    "keyId": "remote-components-2026-01",
    "value": "..."
  }
}
```

---

## 12. Signing and Integrity

The bundling service must sign the canonical manifest after all artifacts are uploaded.

The manifest signature must cover:

- tenant ID;
- package ID;
- version;
- SDK version;
- component names;
- artifact URLs;
- artifact hashes;
- artifact sizes;
- CSS scope.

The private signing key must not be accessible to the Next.js runtime.

The Next.js runtime contains only trusted public keys.

The Next.js loader must:

1. parse the manifest;
2. canonicalize the signed fields;
3. verify the manifest signature;
4. validate tenant and package identifiers;
5. validate the SDK version;
6. fetch an artifact;
7. calculate its SHA-256 digest;
8. compare the digest with the manifest;
9. reject the artifact on any mismatch.

An HTTPS connection alone is not sufficient integrity validation.

---

## 13. Publishing Process

The bundling process must follow this order:

1. validate the source package;
2. validate imports;
3. compile the server bundle;
4. compile the browser bundle;
5. compile isolated CSS;
6. emit static assets;
7. calculate artifact hashes;
8. upload all immutable artifacts;
9. create and sign the manifest;
10. upload the immutable manifest;
11. optionally update a mutable channel pointer.

A channel pointer must only be updated after the immutable manifest is available.

Publishing must be atomic from the consumer's perspective.

---

## 14. Next.js Loader Responsibilities

The Next.js remote loader must provide:

```ts
export interface RemoteComponentLoader {
  resolveManifest(
    tenantId: string,
    packageId: string,
    versionOrChannel: string,
  ): Promise<RemoteComponentManifest>;

  loadServerBundle(
    manifest: RemoteComponentManifest,
  ): Promise<RemoteBundleModule>;

  getBrowserDescriptor(
    manifest: RemoteComponentManifest,
  ): RemoteBrowserDescriptor;
}
```

```ts
export interface RemoteBrowserDescriptor {
  tenantId: string;
  packageId: string;
  version: string;
  browserUrl: string;
  browserSha256: string;
  cssUrl: string;
  cssSha256: string;
  scopeClassName: string;
}
```

---

## 15. Manifest Resolution

Manifest resolution must always include the current tenant ID.

```ts
const manifest = await loader.resolveManifest(
  tenant.id,
  "marketing-components",
  "production",
);
```

The loader must verify:

```ts
if (manifest.tenantId !== tenant.id) {
  throw new Error("The remote component manifest belongs to another tenant.");
}
```

Tenant identity must come from trusted server-side context.

It must not be accepted solely from:

- URL query parameters;
- component props;
- browser-provided JSON;
- page-builder content.

The host may store a package reference in page data, but the active tenant ID must be resolved independently.

---

## 16. Server Bundle Loading

Standard Node.js environments do not reliably support importing arbitrary HTTPS URLs as application modules.

The loader should:

1. fetch the server bundle;
2. verify its hash;
3. persist it in a controlled local cache;
4. import it using a `file:` URL;
5. cache the imported module.

Example:

```ts
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleCache = new Map<string, Promise<RemoteBundleModule>>();

export async function loadServerBundle(
  manifest: RemoteComponentManifest,
): Promise<RemoteBundleModule> {
  const key = [
    manifest.tenantId,
    manifest.packageId,
    manifest.version,
    manifest.artifacts.server.sha256,
  ].join(":");

  const cached = moduleCache.get(key);

  if (cached) {
    return cached;
  }

  const loading = fetchVerifyAndImport(manifest);
  moduleCache.set(key, loading);

  try {
    return await loading;
  } catch (error) {
    moduleCache.delete(key);
    throw error;
  }
}

async function fetchVerifyAndImport(
  manifest: RemoteComponentManifest,
): Promise<RemoteBundleModule> {
  const artifact = manifest.artifacts.server;
  const response = await fetch(artifact.url);

  if (!response.ok) {
    throw new Error(`Failed to fetch the server bundle: ${response.status}.`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex");

  if (digest !== artifact.sha256) {
    throw new Error("The server bundle hash does not match the manifest.");
  }

  const directory = path.join(
    "/tmp",
    "remote-components",
    manifest.tenantId,
    manifest.packageId,
    manifest.version,
  );
  const filename = path.join(directory, `${artifact.sha256}.mjs`);

  await mkdir(directory, { recursive: true });
  await writeFile(filename, bytes, { flag: "wx" }).catch((error) => {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  });

  return import(pathToFileURL(filename).href) as Promise<RemoteBundleModule>;
}
```

The hash must be included in the local filename so that immutable versions cannot collide.

---

## 17. Runtime Requirements

The initial implementation should target the Node.js Next.js runtime.

It should not target the Edge Runtime because the design depends on:

- local temporary storage;
- Node.js crypto APIs;
- dynamic ESM imports from verified local files;
- process-level module caching.

Any Edge Runtime implementation would require a separate execution strategy.

---

## 18. Server-Side Rendering Flow

The server rendering component receives:

- trusted tenant context;
- package ID;
- immutable version or channel;
- component name;
- serializable props.

```tsx
export interface RemoteComponentProps {
  tenantId: string;
  packageId: string;
  version: string;
  componentName: string;
  componentProps: Record<string, unknown>;
}
```

Rendering flow:

1. resolve and verify the manifest;
2. verify tenant ownership;
3. verify SDK compatibility;
4. load and verify the server bundle;
5. call `createRegistry(serverSdk)`;
6. resolve the named component;
7. render it inside the package scope wrapper;
8. emit the local hydration boundary;
9. emit the CSS reference.

Conceptual implementation:

```tsx
export async function RemoteComponent({
  tenantId,
  packageId,
  version,
  componentName,
  componentProps,
}: RemoteComponentProps) {
  const manifest = await remoteLoader.resolveManifest(
    tenantId,
    packageId,
    version,
  );

  const bundle = await remoteLoader.loadServerBundle(manifest);
  const sdk = createServerSdk({ tenantId });
  const registry = bundle.createRegistry(sdk);
  const Component = registry[componentName];

  if (!Component) {
    throw new Error(
      `Remote component "${componentName}" is not present in the bundle.`,
    );
  }

  return (
    <RemoteIslandBoundary
      descriptor={remoteLoader.getBrowserDescriptor(manifest)}
      componentName={componentName}
      componentProps={componentProps}
    >
      <div className={manifest.scopeClassName}>
        <Component {...componentProps} />
      </div>
    </RemoteIslandBoundary>
  );
}
```

The exact wrapper structure must be identical during browser hydration.

---

## 19. Browser Loading

The browser loader must load the browser bundle as a native ESM module.

```ts
const module = await import(
  /* webpackIgnore: true */
  descriptor.browserUrl
);
```

The CDN or S3 distribution must provide:

```http
Content-Type: text/javascript
Access-Control-Allow-Origin: https://host.example.com
Cache-Control: public, max-age=31536000, immutable
```

The browser URL must be immutable and versioned.

The host Content Security Policy must allow scripts from the trusted component CDN origin.

---

## 20. Browser Integrity Verification

Native dynamic `import()` does not provide a direct Subresource Integrity option.

Therefore, one of the following must be selected.

### Option A: Trusted Signed URL and Immutable CDN

The browser imports the immutable bundle URL directly.

Security relies on:

- HTTPS;
- restricted bucket writes;
- signed manifests verified on the server;
- immutable version paths;
- CDN origin protection;
- strict tenant authorization.

This is the simplest initial implementation.

### Option B: Fetch, Verify, and Import Through a Blob URL

The browser:

1. fetches the bundle;
2. calculates SHA-256 using Web Crypto;
3. compares it with the server-provided descriptor;
4. creates a Blob URL;
5. imports the Blob URL.

```ts
async function importVerifiedModule(
  url: string,
  expectedSha256: string,
): Promise<RemoteBundleModule> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch the browser bundle: ${response.status}.`);
  }

  const bytes = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actualSha256 = toHex(new Uint8Array(digest));

  if (actualSha256 !== expectedSha256) {
    throw new Error("The browser bundle hash does not match the manifest.");
  }

  const blob = new Blob([bytes], { type: "text/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    return await import(
      /* webpackIgnore: true */
      blobUrl
    ) as RemoteBundleModule;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
```

This option requires CSP support for `blob:` script sources.

Option B is preferred when browser-side artifact verification is required.

---

## 21. CSS Loading

The hydration boundary must ensure the package CSS is loaded before hydration.

The preferred implementation is a deduplicated stylesheet registry.

```ts
const loadedStylesheets = new Map<string, Promise<void>>();

export function ensureStylesheet(
  url: string,
  integrityKey: string,
): Promise<void> {
  const key = `${url}:${integrityKey}`;
  const existing = loadedStylesheets.get(key);

  if (existing) {
    return existing;
  }

  const loading = new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.dataset.remoteStylesheet = key;
    link.onload = () => {
      resolve();
    };
    link.onerror = () => {
      reject(new Error(`Failed to load the remote stylesheet: ${url}.`));
    };
    document.head.appendChild(link);
  });

  loadedStylesheets.set(key, loading);
  return loading;
}
```

For SSR pages, the host should also emit the stylesheet in the initial document head when the remote component is known during rendering.

```tsx
<link
  rel="stylesheet"
  href={manifest.artifacts.css.url}
  data-remote-stylesheet={`${manifest.packageId}:${manifest.version}`}
/>
```

The client registry must detect already emitted stylesheets.

---

## 22. Hydration Boundary

The hydration boundary is a local Next.js Client Component.

```tsx
"use client";

import { hydrateRoot, type Root } from "react-dom/client";
import { useEffect, useRef } from "react";

export interface RemoteIslandBoundaryProps {
  descriptor: RemoteBrowserDescriptor;
  componentName: string;
  componentProps: Record<string, unknown>;
  children: React.ReactNode;
}

export function RemoteIslandBoundary({
  descriptor,
  componentName,
  componentProps,
  children,
}: RemoteIslandBoundaryProps) {
  const rootElementRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      await ensureStylesheet(
        descriptor.cssUrl,
        descriptor.cssSha256,
      );

      const bundle = await importVerifiedModule(
        descriptor.browserUrl,
        descriptor.browserSha256,
      );

      if (cancelled) {
        return;
      }

      const sdk = createBrowserSdk({
        tenantId: descriptor.tenantId,
      });
      const registry = bundle.createRegistry(sdk);
      const Component = registry[componentName];
      const rootElement = rootElementRef.current;

      if (!Component || !rootElement) {
        return;
      }

      rootRef.current = hydrateRoot(
        rootElement,
        <div className={descriptor.scopeClassName}>
          <Component {...componentProps} />
        </div>,
      );
    }

    void hydrate();

    return () => {
      cancelled = true;
      rootRef.current?.unmount();
    };
  }, [
    componentName,
    componentProps,
    descriptor,
  ]);

  return (
    <div
      ref={rootElementRef}
      data-remote-island
      data-remote-package={descriptor.packageId}
      data-remote-version={descriptor.version}
      data-remote-component={componentName}
    >
      {children}
    </div>
  );
}
```

The production implementation must ensure that serialized props remain referentially stable enough to avoid unnecessary rehydration.

---

## 23. Hydration Consistency Rules

The server and browser render must produce identical initial markup.

Remote components must not:

- read `window` during initial render;
- read `document` during initial render;
- generate random values during render;
- call `Date.now()` during render;
- depend on local browser timezone unless supplied through props;
- branch on server versus browser mode during initial markup generation;
- read mutable external state during initial render;
- generate unstable IDs.

Values that may differ must be supplied through serialized props.

React hooks such as `useId` may be used only after confirming consistent behavior across the isolated server and browser render paths.

---

## 24. Component Props

Props passed into a remote component must be JSON-serializable.

Allowed examples:

- strings;
- numbers;
- booleans;
- null;
- arrays;
- plain objects.

Forbidden examples:

- functions;
- class instances;
- database entities with methods;
- request objects;
- React elements;
- symbols;
- cyclic objects;
- secrets.

Event behavior must be implemented through the SDK or declarative action descriptors.

```ts
export interface RemoteAction {
  type: string;
  payload?: Record<string, unknown>;
}
```

Example:

```tsx
<sdk.components.Button
  action={{
    type: "navigate",
    payload: {
      href: "/pricing",
    },
  }}
>
  View pricing
</sdk.components.Button>
```

---

## 25. Caching

The loader should implement four cache layers.

### 25.1 Manifest Cache

Key:

```text
tenantId:packageId:version
```

Channel pointers should use a short TTL.

Immutable version manifests may use a long TTL.

### 25.2 Artifact Cache

Server bundle files are cached by SHA-256 digest.

```text
/tmp/remote-components/{tenantId}/{packageId}/{version}/{sha256}.mjs
```

### 25.3 Module Cache

Imported server modules are cached by:

```text
tenantId:packageId:version:serverSha256
```

### 25.4 Browser Cache

Browser bundles and styles use immutable CDN caching.

```http
Cache-Control: public, max-age=31536000, immutable
```

Mutable channel pointer files must use short caching or explicit revalidation.

---

## 26. Version Resolution

Published page data should preferably store an immutable component version.

```ts
export interface RemoteComponentReference {
  packageId: string;
  version: string;
  componentName: string;
}
```

Using mutable channels during live page rendering can cause:

- server/browser version mismatches;
- inconsistent HTML across requests;
- unexpected production changes;
- difficult rollbacks.

Recommended behavior:

- editors may resolve `preview`;
- published pages store the resolved immutable version;
- production SSR loads the immutable version.

---

## 27. Failure Handling

The runtime must define explicit failure behavior for:

- manifest unavailable;
- invalid signature;
- unsupported SDK version;
- server bundle unavailable;
- server bundle hash mismatch;
- browser bundle unavailable;
- browser bundle hash mismatch;
- CSS unavailable;
- component export missing;
- SSR exception;
- hydration exception.

A host-defined fallback component should be rendered.

```tsx
export function RemoteComponentErrorFallback({
  componentName,
}: {
  componentName: string;
}) {
  return (
    <div data-remote-component-error>
      Component "{componentName}" could not be rendered.
    </div>
  );
}
```

Production error messages shown to website visitors must not expose:

- storage paths;
- tenant IDs;
- stack traces;
- signing details;
- internal SDK data.

Detailed errors should be sent to observability systems.

---

## 28. Timeouts and Limits

The loader must enforce configurable limits.

Recommended initial limits:

```ts
export interface RemoteComponentLimits {
  manifestTimeoutMs: number;
  serverBundleTimeoutMs: number;
  browserBundleTimeoutMs: number;
  maximumServerBundleBytes: number;
  maximumBrowserBundleBytes: number;
  maximumCssBytes: number;
  maximumComponentCount: number;
}
```

Example defaults:

```ts
export const remoteComponentLimits = {
  manifestTimeoutMs: 2_000,
  serverBundleTimeoutMs: 5_000,
  browserBundleTimeoutMs: 8_000,
  maximumServerBundleBytes: 2_000_000,
  maximumBrowserBundleBytes: 2_000_000,
  maximumCssBytes: 500_000,
  maximumComponentCount: 100,
} satisfies RemoteComponentLimits;
```

A bundle exceeding a configured limit must be rejected before execution.

---

## 29. Observability

Every load and render operation should record:

- tenant ID;
- package ID;
- version;
- component name;
- manifest resolution duration;
- artifact download duration;
- cache hit or miss;
- server import duration;
- SSR duration;
- browser bundle load duration;
- hydration duration;
- failure category.

Bundle hashes should be logged.

Remote source code and component props should not be logged by default.

---

## 30. Security Requirements

The system executes generated JavaScript and must treat publication as privileged code deployment.

Minimum requirements:

- immutable bundle paths;
- signed manifests;
- hash verification;
- restricted bucket write access;
- tenant ownership validation;
- strict SDK surface;
- import allowlist;
- bundle-size limits;
- execution timeouts where possible;
- CSP restrictions;
- no application secrets in the SDK;
- no arbitrary Node.js imports;
- no arbitrary host imports.

This design assumes generated code is trusted enough to execute in the Next.js server process after validation.

If generated code must be treated as hostile, the server bundle must execute in a separate process, worker, container, or sandboxed service rather than inside the Next.js process.

---

## 31. Suggested Module Structure

```text
src/
  remote-components/
    contracts/
      bundle.ts
      manifest.ts
      sdk.ts
    loader/
      manifest-loader.ts
      signature-verifier.ts
      artifact-loader.ts
      server-module-loader.ts
      cache.ts
    runtime/
      create-server-sdk.ts
      create-browser-sdk.ts
      RemoteComponent.tsx
      RemoteIslandBoundary.tsx
      stylesheet-registry.ts
      browser-module-loader.ts
    errors/
      remote-component-errors.ts
```

Bundler:

```text
remote-component-bundler/
  src/
    validate-source.ts
    validate-imports.ts
    build-server.ts
    build-browser.ts
    build-css.ts
    emit-assets.ts
    create-manifest.ts
    sign-manifest.ts
    publish.ts
```

---

## 32. Implementation Phases

### Phase 1

- one package per tenant;
- one server bundle;
- one browser bundle;
- one CSS file;
- immutable versions;
- Node.js runtime only;
- direct CDN browser import;
- server-side hash verification;
- in-memory module cache;
- selector-scoped CSS.

### Phase 2

- browser-side bundle hash verification;
- signed manifest verification;
- persistent cache;
- channel pointers;
- preview and production versions;
- automatic fallback handling;
- observability metrics.

### Phase 3

- multiple packages per tenant;
- package dependency analysis;
- shared approved libraries;
- component-level lazy loading;
- optional bundle chunking;
- isolated execution service for server bundles.

---

## 33. Acceptance Criteria

The implementation is complete when:

1. a component package can be compiled into server, browser, and CSS artifacts;
2. all artifacts are published under immutable tenant-scoped paths;
3. a signed manifest describes all artifacts;
4. the Next.js server can resolve a tenant package by immutable version;
5. the Next.js server verifies the manifest and server bundle;
6. the server bundle receives only the controlled server SDK;
7. a named component renders during SSR;
8. the browser loads the matching browser bundle;
9. the browser bundle receives only the controlled browser SDK;
10. the SSR markup hydrates without mismatch warnings;
11. package CSS loads once and remains scope-isolated;
12. one tenant cannot load another tenant's package;
13. invalid signatures and hashes are rejected;
14. published component versions remain immutable;
15. a component package can be updated without rebuilding the Next.js host.

---

## 34. Architectural Decision Summary

The selected design is:

- precompiled dual ESM bundles;
- one bundle for Node.js SSR;
- one bundle for browser hydration;
- one isolated CSS artifact;
- immutable tenant-scoped publication;
- signed manifests;
- SHA-256 artifact verification;
- a tightly controlled injected SDK;
- a local Next.js client boundary;
- isolated React-root hydration;
- no dependency on the Next.js static import graph.

This provides runtime-deployable tenant components with SSR support while keeping the host integration explicit and controlled.

---

## Appendix A: Webiny Integration

This appendix maps the generic specification to Webiny's existing architecture and documents Webiny-specific design decisions.

### A.1 Concept Mapping

| Spec Concept | Webiny Equivalent |
|---|---|
| Remote Component | After loading: a standard `Component` object (`{ component, manifest }`) — identical to statically defined components. Defined in `website-builder-sdk/src/types.ts`. |
| Component Registry | `ComponentRegistry` singleton in `website-builder-sdk/src/ComponentRegistry.ts`. Components are registered by `manifest.name` via `register()` and looked up via `get()`. |
| `createRegistry(sdk)` return value | Returns `Component[]` — the output of `createComponent()` calls. Each entry carries both the React component and its `ComponentManifest` (inputs, label, constraints, tags). |
| Host SDK (`RemoteRuntimeSdk`) | `{ version, dependencies, environment }`. `dependencies.sdk` provides the full `@webiny/sdk-nextjs` module (`createComponent`, `createTextInput`, `createSlotInput`, `ComponentProps`, etc.). `dependencies.React` provides the host's React instance. The bundle does not bundle any SDK or React code itself. |
| Component props contract | Generated component code uses `ComponentProps<T>` (`{ inputs, styles, element, breakpoint }`) internally. This is an implementation detail of the generated code, handled through `createComponent()`. |
| Document integration | Documents do not distinguish between static and remote components. Each element carries a `component.name` string resolved by `ComponentRegistry`. The Next.js application is responsible for providing all required components — static and remote — to `DocumentRenderer`. |
| Remote Island Boundary | Not required in Phase 1. Remote components render through the same React tree as static components via `LiveElementRenderer`. Isolated React-root hydration becomes relevant only when remote components need their own React version or truly isolated state. |
| Manifest resolution | `RemoteComponentLoader` class in `@webiny/sdk-nextjs`. Phase 1 uses direct manifest URLs. Tenant-scoped resolution is a Phase 5 concern. |
| Component rendering | `DocumentRenderer` → `ElementRenderer` → `LiveElementRenderer` → `ComponentResolver.resolve()`. Remote components pass through this pipeline identically to static components once registered. |

### A.2 Static Component Pattern (Existing)

The current Webiny pattern for defining components in a Next.js application:

```tsx
import { createComponent, createTextInput } from "@webiny/sdk-nextjs";

function Banner({ inputs: { headline } }: ComponentProps<{ headline: string }>) {
    return <h2>{headline}</h2>;
}

export const editorComponents = [
    createComponent(Banner, {
        name: "Custom/Banner",
        label: "Banner",
        inputs: [
            createTextInput({ name: "headline", label: "Headline", defaultValue: "Ready?" })
        ]
    })
];
```

The user passes these to `DocumentRenderer`:

```tsx
<DocumentRenderer document={page} components={editorComponents} />
```

### A.3 Remote Bundle Export Contract (Webiny-Specific)

A remote bundle must export the following shape:

```ts
export const metadata = {
    packageId: "marketing-components",
    version: "01J0ABCD1234",
    sdkVersion: "1",
    componentNames: ["Tenant/Hero", "Tenant/FeatureGrid"]
};

export function createRegistry(runtime) {
    const { React, sdk } = runtime.dependencies;
    const { createComponent, createTextInput } = sdk;

    function Hero({ inputs: { title, subtitle } }) {
        return React.createElement("section", null,
            React.createElement("h1", null, title),
            React.createElement("p", null, subtitle)
        );
    }

    function FeatureGrid({ inputs: { items } }) {
        return React.createElement("div", { className: "grid" },
            items.map((item, i) =>
                React.createElement("div", { key: i }, item.label)
            )
        );
    }

    return [
        createComponent(Hero, {
            name: "Tenant/Hero",
            label: "Hero",
            inputs: [
                createTextInput({ name: "title", label: "Title" }),
                createTextInput({ name: "subtitle", label: "Subtitle" })
            ]
        }),
        createComponent(FeatureGrid, {
            name: "Tenant/FeatureGrid",
            label: "Feature Grid",
            inputs: []
        })
    ];
}
```

The `createRegistry` function receives `RemoteRuntimeSdk` and destructures `dependencies` to access the host's React and SDK. The returned `Component[]` array is identical in shape to what `createComponent()` produces in static code.

Note: the example uses `React.createElement` because the remote bundle cannot use JSX syntax directly — JSX compilation happens at bundling time and must be configured to use the injected React reference rather than a bundled one.

### A.4 `RemoteRuntimeSdk` Contract

```ts
interface RemoteRuntimeSdk {
    version: "1";
    dependencies: {
        sdk: typeof import("@webiny/sdk-nextjs");
        React: typeof import("react");
    };
    environment: {
        tenantId: string;
        locale: string;
        mode: "server" | "browser";
    };
}
```

`dependencies.sdk` exposes the entire `@webiny/sdk-nextjs` module. `dependencies.React` exposes the host's React instance. This ensures:

- remote bundles do not bundle any SDK or React code;
- API compatibility is guaranteed because the bundle uses the host's exact SDK and React versions;
- the `sdkVersion` field in bundle metadata gates compatibility for breaking changes.

### A.5 Remote Component Loading Flow (Webiny)

The loading flow integrates with the existing rendering pipeline:

1. The Next.js page component (async Server Component) fetches page data via `contentSdk.wb.getPage(path)`.
2. The page component calls `remoteLoader.loadComponents(manifestUrl)` which:
   a. fetches the manifest JSON;
   b. fetches the server bundle `.mjs`;
   c. verifies the SHA-256 hash;
   d. writes the bundle to a local cache directory;
   e. dynamically imports the bundle via `file:` URL;
   f. calls `module.createRegistry(serverSdk)` with the injected SDK;
   g. returns `Component[]`.
3. The page component passes all components — static and remote — to `DocumentRenderer`:

```tsx
const remoteLoader = new RemoteComponentLoader();

export default async function Page({ params }) {
    const page = await contentSdk.wb.getPage(params.path);

    const remoteComponents = await remoteLoader.loadComponents(
        "https://cdn.example.com/.../manifest.json"
    );

    return (
        <DocumentRenderer
            document={page}
            components={[...editorComponents, ...remoteComponents]}
        />
    );
}
```

4. `DocumentRenderer` registers all components into `ComponentRegistry`.
5. `LiveElementRenderer` resolves each element's `component.name` from the registry and renders it — identically for static and remote components.

### A.6 Key Divergences from the Generic Specification

1. **Factory return type.** The generic spec defines `createRegistry(sdk)` as returning `Record<string, ComponentType>`. In Webiny, it returns `Component[]` because each component must carry its `ComponentManifest` (inputs, constraints, tags, label, etc.) alongside the React component function.

2. **SDK surface.** The generic spec envisions a minimal, hand-crafted SDK with selected UI primitives (`Button`, `Link`, `Image`) and utilities. In Webiny, the SDK injects the full `@webiny/sdk-nextjs` module and the host's React instance via `dependencies`. This is broader but simpler — the bundle has access to the same API as static component code. The surface can be narrowed in future SDK versions.

3. **No isolated React roots in Phase 1.** The generic spec prescribes isolated `hydrateRoot()` per remote component. In Webiny, remote components hydrate through the existing React tree (`DocumentRenderer` → `LiveElementRenderer`). Isolated roots become relevant only when remote components need separate React versions or truly isolated state.

4. **Document does not carry manifest URLs.** The generic spec describes manifest resolution from document data. In Webiny, documents are agnostic to how components are sourced. The Next.js application controls which manifest URLs to load.

5. **Slot handling.** The generic spec's `sdk.components` includes slot-related primitives. In Webiny, slots are declared via `createSlotInput()` in the component manifest and rendered via `ElementSlot`. No special SDK injection is needed for slots.

### A.7 Phased Implementation Summary

| Phase | Scope |
|---|---|
| 1 | Server-side loader in `sdk-nextjs`: fetch manifest, verify server bundle, import, inject SDK, return `Component[]`. No browser hydration beyond the existing React tree. |
| 2 | CSS loading, error fallbacks, observability hooks, persistent filesystem cache. |
| 3 | Browser hydration via `RemoteIslandBoundary`, browser bundle loading, stylesheet deduplication. |
| 4 | Manifest signing (Ed25519), browser-side bundle verification, CSS selector scoping, import validation. |
| 5 | Multi-tenant resolution, channel pointers, per-request component resolution, production observability. |