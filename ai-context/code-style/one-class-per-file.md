# One Class Per File

When generating code, one file MUST only contain one class.

```ts
// Good: Foo.ts
export class Foo {}
```

```ts
// Bad: Foo.ts
export class Foo {}
export class Bar {} // move to Bar.ts
```

## Exception: a definition and the handler it names

An HTTP route and a background task are each two classes that exist only as a pair, and each pair
belongs in one file.

`HttpRouteDefinition` carries the method, the path and a reference to the handler. It takes no
dependencies, so the router can build every definition and match a request without constructing any
handler. `HttpRouteHandler` takes the dependencies and runs only once a request reaches that path.

Splitting them across two files buys nothing: neither is usable or testable without the other, and
the definition's only content is three fields naming the handler beside it. Keeping them together
also keeps the path next to the code that serves it.

```ts
// Good: AiChatStreamRoute.ts
class AiChatStreamRouteImpl implements HttpRouteHandler.Interface {
  constructor(private readonly aiChat: AiChatUseCase.Interface) {}
  async handle(request: IHttpRequest, response: IHttpResponseBuilder) {
    /* ... */
  }
}

export const AiChatStreamRoute = HttpRouteHandler.createImplementation({
  implementation: AiChatStreamRouteImpl,
  dependencies: [AiChatUseCase]
});

class AiChatStreamRouteDefinitionImpl implements HttpRouteDefinition.Interface {
  readonly method = "POST";
  readonly path = "/stream/ai/chat";
  readonly handler = AiChatStreamRoute;
}

export const AiChatStreamRouteDefinition = HttpRouteDefinition.createImplementation({
  implementation: AiChatStreamRouteDefinitionImpl,
  dependencies: []
});
```

Only the definition is registered with the container. The router resolves the handler it names.

A task definition is the same shape for the same reason, so it follows the same rule:

```ts
// Good: EmptyTrashBinTask.ts
class EmptyTrashBinTaskHandlerImpl implements TaskHandler.Interface {
  constructor(private readonly listTenants: ListTenantsUseCase.Interface) {}
  async run(params: TaskHandler.RunParams) {
    /* ... */
  }
}

const EmptyTrashBinTaskHandler = TaskHandler.createImplementation({
  implementation: EmptyTrashBinTaskHandlerImpl,
  dependencies: [ListTenantsUseCase]
});

class EmptyTrashBinTask implements TaskDefinition.Interface {
  readonly id = "hcmsEntriesEmptyTrashBins";
  readonly title = "Headless CMS - Empty all trash bins";
  readonly handler = EmptyTrashBinTaskHandler;
}

export const EmptyTrashBinTaskDefinition = TaskDefinition.createImplementation({
  implementation: EmptyTrashBinTask,
  dependencies: []
});
```

Name the file after the task, not after the definition half: `EmptyTrashBinTask.ts`, matching
`MockDataManagerTask.ts` and `CreateIndexesTask.ts`. The file holds both halves, so naming it for one
of them misleads.
