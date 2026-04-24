# @cloudi/aws

DI-enabled cloud (AWS Lambda) functions. Write cloud functions using Dependency Injection.

## Overview

`@cloudi/aws` is a framework for building AWS Lambda functions using **Dependency Injection (DI)**. It provides:

- 🎯 **Type-safe abstractions** for AWS event types (API Gateway, SNS, SQS, S3, DynamoDB, EventBridge)
- 💉 **Dependency Injection** via `@webiny/di` container
- 🔗 **Middleware chain** - handlers compose via `next()`, enabling pre/post processing
- 🧪 **Testable** - mock dependencies easily for unit testing
- 🏗️ **SOLID principles** - write clean, maintainable Lambda functions

## Installation

```bash
npm install @cloudi/aws @webiny/di
# or
yarn add @cloudi/aws @webiny/di
```

## Quick Start

### 1. Define Your Handler

Each handler receives `(event, next)`. Call `next()` to pass the event to the next handler in the chain, or return a result to claim the event.

```typescript
import {
  ApiGatewayEventHandler,
  type APIGatewayEvent,
  type APIGatewayProxyResult
} from "@cloudi/aws";
import type { NextFunction } from "@cloudi/aws";

class ListUsersHandler implements ApiGatewayEventHandler.Interface {
  constructor(private userService: IUserService) {}

  async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
    if (event.httpMethod !== "GET" || !event.path.startsWith("/users")) {
      return next();
    }

    const users = await this.userService.listUsers();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users })
    };
  }
}

export const listUsersHandler = ApiGatewayEventHandler.createImplementation({
  implementation: ListUsersHandler,
  dependencies: [UserService]
});
```

### 2. Create Your Lambda Handler

```typescript
import { createFunction } from "@cloudi/aws";
import { listUsersHandler } from "./handlers/ListUsersHandler";
import { userService } from "./services/UserService";

export const handler = createFunction(async container => {
  container.register(userService).inSingletonScope();
  container.register(listUsersHandler).inSingletonScope();
});
```

### 3. Deploy and Invoke

Your Lambda function will automatically:

- ✅ Walk the registered handler chain on each invocation
- ✅ Inject dependencies from the container
- ✅ Execute your business logic
- ✅ Return the result from the first handler that claims the event

## Core Concepts

### Middleware Chain

All registered handlers form a single middleware chain. Each handler receives the event and a `next` function. The chain executes in registration order — first registered runs first.

```
event
  ↓
Handler1.execute(event, next)  →  calls next() — passes through
  ↓
Handler2.execute(event, next)  →  returns result — claims the event
  ↓
result
```

If no handler claims the event, an error is thrown.

### Handler Interface

```typescript
export interface ICloudHandler<TEvent = any, TResult = any> {
  execute(event: TEvent, next: NextFunction): Promise<TResult>;
}

export type NextFunction = () => Promise<any>;
```

Every handler implements this interface via one of the typed event handler namespaces.

### Event Handler Namespaces

Each AWS event type has a dedicated namespace with `.Interface` for type-safe implementation and `.createImplementation()` for DI registration:

| Namespace                 | Event type            | Result type             |
| ------------------------- | --------------------- | ----------------------- |
| `ApiGatewayEventHandler`  | `APIGatewayEvent`     | `APIGatewayProxyResult` |
| `SnsEventHandler`         | `SNSEvent`            | `SnsResult`             |
| `SqsEventHandler`         | `SQSEvent`            | `SqsResult`             |
| `S3EventHandler`          | `S3Event`             | `S3Result`              |
| `DynamoDBEventHandler`    | `DynamoDBStreamEvent` | `DynamoDBResult`        |
| `EventBridgeEventHandler` | `EventBridgeEvent`    | `EventBridgeResult`     |
| `RawEventHandler`         | `any`                 | `any`                   |

All namespaces register under the shared `CloudHandler` abstraction so `createFunction` can resolve the full chain from the container.

### Dependency Injection

Use the DI container to manage dependencies:

```typescript
import { Abstraction } from "@webiny/di";

// Define abstraction
const Logger = new Abstraction<ILogger>("Logger");

// Create implementation
const logger = Logger.createImplementation({
  implementation: class ConsoleLogger implements ILogger {
    info(message: string): void {
      console.log(message);
    }
  },
  dependencies: []
});

// Register in container
container.register(logger).inSingletonScope();
```

### AWS Lambda Context

Access Lambda context in your services (e.g., for request ID, remaining time):

```typescript
import { AwsLambdaContext } from "@cloudi/aws";
import type { Context } from "aws-lambda";

class ContextAwareLogger implements ILogger {
  constructor(private context: Context) {}

  info(message: string): void {
    console.log({ message, requestId: this.context.awsRequestId });
  }
}

const logger = Logger.createImplementation({
  implementation: ContextAwareLogger,
  dependencies: [AwsLambdaContext] // injected per invocation
});
```

## Examples

### Single-Function Multi-Event Lambda

Handle multiple event types in one Lambda. Each handler checks the event and either claims it or calls `next()`:

```typescript
export const handler = createFunction(async container => {
  container.register(logger).inSingletonScope();
  container.register(userService).inSingletonScope();

  // Registered in order — each checks the event and passes through or handles
  container.register(apiGatewayHandler).inSingletonScope();
  container.register(snsHandler).inSingletonScope();
  container.register(sqsHandler).inSingletonScope();
});
```

### Pre/Post Processing

Because handlers are middleware, you can wrap logic around the rest of the chain:

```typescript
const timingHandler = ApiGatewayEventHandler.createImplementation({
  implementation: class {
    async execute(event: APIGatewayEvent, next: NextFunction) {
      const start = Date.now();
      const result = await next();
      console.log(`Request took ${Date.now() - start}ms`);
      return result;
    }
  },
  dependencies: []
});

export const handler = createFunction(async container => {
  container.register(timingHandler).inSingletonScope(); // runs first
  container.register(listUsersHandler).inSingletonScope(); // claims the event
});
```

### Testing

Mock dependencies for easy unit testing:

```typescript
import { describe, it, expect } from "vitest";
import { createFunction } from "@cloudi/aws";
import { ApiGatewayEventHandler } from "@cloudi/aws";

describe("ListUsersHandler", () => {
  it("should list users", async () => {
    const MockUserService = UserService.createImplementation({
      implementation: class {
        async listUsers() {
          return [{ id: "1", name: "Test User" }];
        }
      },
      dependencies: []
    });

    const handler = createFunction(container => {
      container.register(MockUserService);
      container.register(listUsersHandler);
    });

    const result = await handler({
      httpMethod: "GET",
      path: "/users",
      headers: {},
      requestContext: {} as any,
      body: null,
      isBase64Encoded: false
    });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).users).toHaveLength(1);
  });
});
```

### Using with pino-lambda

```typescript
import pino from "pino";
import { pinoLambdaDestination } from "pino-lambda";
import { AwsLambdaContext } from "@cloudi/aws";

const logger = Logger.createImplementation({
  implementation: class PinoLogger implements ILogger {
    private logger: pino.Logger;
    private destination: ReturnType<typeof pinoLambdaDestination>;

    constructor(context: Context) {
      this.destination = pinoLambdaDestination();
      this.logger = pino({}, this.destination);
      this.destination.setContext(context);
    }

    info(message: string, data?: any): void {
      this.logger.info(data || {}, message);
    }
  },
  dependencies: [AwsLambdaContext]
});
```

## Architecture

### How It Works

1. **Cold start**: `createFunction` runs `setup(container)` once — registers all implementations
2. **Per invocation**:
   - Current `event` and `context` are registered as instances
   - All `CloudHandler` implementations are resolved from the container
   - A middleware chain is built in registration order
   - `chain()` is called — handlers execute sequentially via `next()`
   - First handler to return a value wins

```
AWS Lambda Invoke
       ↓
createFunction (warm: skip setup)
       ↓
container.resolveAll(CloudHandler)
       ↓
Build middleware chain (registration order)
       ↓
Handler1.execute(event, next)
       ↓  next()
Handler2.execute(event, next)  →  returns result
       ↓
Return result to Lambda
```

### Project Structure

```
src/
├── abstractions/
│   ├── functions/          # event handler namespaces (ApiGatewayEventHandler, SnsEventHandler, etc.)
│   ├── CloudHandler.ts     # Base abstraction + ICloudHandler interface
│   ├── AwsLambdaContext.ts
│   └── AwsLambdaEvent.ts
├── createFunction.ts       # Lambda handler factory
├── types.ts                # NextFunction, FunctionSetup, etc.
└── index.ts
```

## API Reference

### `createFunction(setup)`

Creates a Lambda handler. `setup` runs once on cold start.

```typescript
type FunctionSetup = (container: Container) => Promise<void> | void;

export const handler = createFunction(async container => {
  container.register(myHandler).inSingletonScope();
});
```

### Event Handler Namespaces

Each namespace exposes:

```typescript
// Type for implementing the handler
namespace ApiGatewayEventHandler {
  type Interface = ICloudHandler<APIGatewayEvent, APIGatewayProxyResult>;

  function createImplementation<I extends Constructor<Interface>>(params: {
    implementation: I;
    dependencies: Dependencies<I>;
  }): Implementation<I>;
}
```

Usage:

```typescript
class MyHandler implements ApiGatewayEventHandler.Interface {
  async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
    // ...
  }
}

export const myHandler = ApiGatewayEventHandler.createImplementation({
  implementation: MyHandler,
  dependencies: [SomeDependency]
});
```

### `CloudHandler`

The base `Abstraction<ICloudHandler>` that all event handler namespaces register under. Advanced usage:

```typescript
import { CloudHandler } from "@cloudi/aws";

// Resolve all handlers directly (createFunction does this internally)
const handlers = container.resolveAll(CloudHandler);
```

### `NextFunction`

```typescript
type NextFunction = () => Promise<any>;
```

Call `next()` from within `execute` to pass the event to the next handler in the chain.

## Best Practices

### ✅ Do

- Keep handlers focused — one responsibility per handler
- Guard early with `if (!matches) return next()` at the top of `execute`
- Register services in singleton scope when they hold no per-request state
- Use `ApiGatewayEventHandler`, `SnsEventHandler`, etc. for type safety even if the event type overlaps

### ❌ Don't

- Don't create services inside handlers — use DI
- Don't mix business logic with AWS-specific marshalling code
- Don't register the same singleton implementation twice (it will appear twice in the chain)
- Don't forget to call `return next()` — a handler that falls through without returning will return `undefined`

## Troubleshooting

### No handler processes the event

`Error: No registered function implementation handled this event`

All registered handlers called `next()` without returning a value. Check that at least one handler recognises the event shape and returns a result.

### Handler executes for wrong event type

Each handler is responsible for its own type check. Add an early guard:

```typescript
async execute(event: any, next: NextFunction) {
    if (!event.httpMethod) return next();
    // handle API Gateway event
}
```

### Dependency not resolving

1. Ensure the abstraction is registered in the container before it's needed
2. Check the `dependencies` array in `createImplementation` matches constructor parameter order
3. Verify the same `Abstraction` instance is used everywhere (don't `new Abstraction(...)` twice)

## Related Documentation

- [@webiny/di](https://www.npmjs.com/package/@webiny/di) — DI container API
- [AWS Lambda Abstractions](./src/abstractions/AWS_LAMBDA_ABSTRACTIONS.md) — Context and Event usage
- [Examples](./src/features/) — Complete working examples

## License

MIT
