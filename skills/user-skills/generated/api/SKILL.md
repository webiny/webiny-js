---
name: webiny-api-catalog
context: webiny-api
description: >
  api — 35 abstractions.
---

# api

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---

**Name:** `Ai`
**Import:** `import { Ai } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** Interact with AI language models using registered providers.

---

**Name:** `AiConnectionFactory`
**Import:** `import { AiConnectionFactory } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** Factory that asynchronously produces an AiConnection.

---

**Name:** `AiModelRegistry`
**Import:** `import { AiModelRegistry } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** Single source of truth for available AI models. Decoratable to restrict the model list.

---

**Name:** `AiSdk`
**Import:** `import { AiSdk } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** A single AI SDK instance (e.g. OpenAI, Anthropic) that resolves model instances.

---

**Name:** `AiSdkFactory`
**Import:** `import { AiSdkFactory } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** Factory that asynchronously initialises an AI SDK. Register one per provider namespace.

---

**Name:** `AiSdkToolDefinition`
**Import:** `import { AiSdkToolDefinition } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`

---

**Name:** `AiSdkToolHandler`
**Import:** `import { AiSdkToolHandler } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** The behaviour half of a tool, built on demand through {@link AiSdkToolHandlerResolver}.

Implementations are NOT registered against this abstraction. The definition points at the class
directly, exactly as `HttpRouteDefinition` points at its `HttpRouteHandler`. Declaring them
through it is what attaches their dependency metadata.

---

**Name:** `BaseError`
**Import:** `import { BaseError } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`

---

**Name:** `BuildParam`
**Import:** `import { BuildParam } from "webiny/api"`
**Source:** `@webiny/api-core/features/buildParams/index.ts`
**Description:** A single build-time configuration parameter.

---

**Name:** `BuildParams`
**Import:** `import { BuildParams } from "webiny/api"`
**Source:** `@webiny/api-core/features/buildParams/index.ts`
**Description:** Access build-time configuration parameters.

---

**Name:** `Compression`
**Import:** `import { Compression } from "webiny/api"`
**Source:** `@webiny/utils/features/compression/abstractions/Compression.ts`

---

**Name:** `CompressionHandler`
**Import:** `import { CompressionHandler } from "webiny/api"`
**Source:** `@webiny/utils/features/compression/abstractions/CompressionHandler.ts`

---

**Name:** `createAbstraction`
**Import:** `import { createAbstraction } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`

---

**Name:** `createFeature`
**Import:** `import { createFeature } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`

---

**Name:** `DomainEvent`
**Import:** `import { DomainEvent } from "webiny/api"`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Base class for all domain events.

---

**Name:** `Encryption`
**Import:** `import { Encryption } from "webiny/api"`
**Source:** `@webiny/api-core/features/encryption/index.ts`
**Description:** Symmetric encryption and decryption using a configured secret key.

---

**Name:** `EventPublisher`
**Import:** `import { EventPublisher } from "webiny/api"`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Publish domain events to registered handlers.

---

**Name:** `GlobalKeyValueStore`
**Import:** `import { GlobalKeyValueStore } from "webiny/api"`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Global (non-tenant-scoped) key-value store.

---

**Name:** `Hasher`
**Import:** `import { Hasher } from "webiny/api"`
**Source:** `@webiny/api-core/features/hashing/index.ts`
**Description:** Hashes and verifies secret values (passwords, API-key secrets, tokens, …) with a slow, salted
KDF — built for the "store a hash, later verify a presented value" pattern.

NOT a general-purpose digest: output is salted and non-deterministic, so this is the wrong tool
for checksums / cache keys / dedup (use a fast deterministic digest util for those). Swap the
implementation to change algorithms (e.g. Argon2id); stored hashes are self-describing, so old
hashes keep verifying after a swap.

---

**Name:** `HttpAllowedRequestHeaders`
**Import:** `import { HttpAllowedRequestHeaders } from "webiny/api"`
**Source:** `@webiny/api-kernel-core/features/http/abstractions.ts`

---

**Name:** `HttpRouteDefinition`
**Import:** `import { HttpRouteDefinition } from "webiny/api"`
**Source:** `@webiny/api-kernel-core/features/http/abstractions.ts`

---

**Name:** `HttpRouteHandler`
**Import:** `import { HttpRouteHandler } from "webiny/api"`
**Source:** `@webiny/api-kernel-core/features/http/abstractions.ts`
**Description:** Declares a route's request handling. One shared abstraction: the router never resolves it from the
container (that would build every route), it builds the ONE class a matched definition points at.
Declaring implementations through it is what attaches their dependency metadata.

---

**Name:** `IAiConnection`
**Kind:** type
**Import:** `import type { IAiConnection } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`

---

**Name:** `IAiConnectionInline`
**Kind:** type
**Import:** `import type { IAiConnectionInline } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`

---

**Name:** `IHttpRequest`
**Kind:** type
**Import:** `import type { IHttpRequest } from "webiny/api"`
**Source:** `@webiny/api-kernel-core/features/http/abstractions.ts`

---

**Name:** `IHttpResponse`
**Kind:** type
**Import:** `import type { IHttpResponse } from "webiny/api"`
**Source:** `@webiny/api-kernel-core/features/http/abstractions.ts`

---

**Name:** `IHttpResponseBuilder`
**Kind:** type
**Import:** `import type { IHttpResponseBuilder } from "webiny/api"`
**Source:** `@webiny/api-kernel-core/features/http/abstractions.ts`
**Description:** The mutable response handed to every route as the second argument to `handle()` — the `res` of
Express-style handlers. Every method returns `this`, so a route can chain and then return the
builder directly:

```ts
async handle(request: IHttpRequest, response: IHttpResponseBuilder) {
    return response.status(201).cookie("sid", id, { httpOnly: true }).json({ id });
}
```

Returning it is optional: a route that mutates it and returns nothing gets the same response.
Routes returning a plain {@link IHttpResponse} keep working — anything set on the builder
(headers, cookies) is merged underneath the returned object, which wins on conflicts.

---

**Name:** `IMatchedRouteDefinition`
**Kind:** type
**Import:** `import type { IMatchedRouteDefinition } from "webiny/api"`
**Source:** `@webiny/api-kernel-core/features/http/abstractions.ts`
**Description:** Which route the router matched, as seen from inside `handle()` — the `req.route` of Express-style
handlers. It is the definition without its `handler`, so a route (or anything wrapping one) can
tell WHICH route is running and act only on the one it cares about.

---

**Name:** `KeyValueStore`
**Import:** `import { KeyValueStore } from "webiny/api"`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Tenant-scoped key-value store.

---

**Name:** `Logger`
**Import:** `import { Logger } from "webiny/api"`
**Source:** `@webiny/api-core/features/logger/index.ts`
**Description:** Structured logging with multiple log levels.

---

**Name:** `Result`
**Import:** `import { Result } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`
**Description:** A container type that represents either a successful result (`ok`) or a failure (`fail`).
Inspired by functional programming constructs like `Either` or `Result` in other languages.

---

**Name:** `WebsocketsDisconnectUseCase`
**Import:** `import { WebsocketsDisconnectUseCase } from "webiny/api"`
**Source:** `@webiny/api-websockets/features/Disconnect/abstractions.ts`

---

**Name:** `WebsocketsListConnectionsUseCase`
**Import:** `import { WebsocketsListConnectionsUseCase } from "webiny/api"`
**Source:** `@webiny/api-websockets/features/ListConnections/abstractions.ts`

---

**Name:** `WebsocketsSendToConnectionsUseCase`
**Import:** `import { WebsocketsSendToConnectionsUseCase } from "webiny/api"`
**Source:** `@webiny/api-websockets/features/SendToConnections/abstractions.ts`

---

**Name:** `WebsocketsSendToIdentityUseCase`
**Import:** `import { WebsocketsSendToIdentityUseCase } from "webiny/api"`
**Source:** `@webiny/api-core/features/websockets/index.ts`
**Description:** Sends a message to every open websocket connection of an identity. Declared here so that any
package can send without depending on a websockets package; `@webiny/api-websockets` implements it.
Without that package the send does nothing, see `NullSendToIdentityUseCase`.

---
