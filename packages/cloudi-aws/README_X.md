# @cloudi/aws

DI-enabled cloud (AWS Lambda) functions. Write cloud functions using Dependency Injection.

## Overview

`@cloudi/aws` is a framework for building AWS Lambda functions using **Dependency Injection (DI)**. It provides:

- 🎯 **Type-safe abstractions** for AWS event types (API Gateway, SNS, SQS, S3, DynamoDB, EventBridge)
- 💉 **Dependency Injection** via `@webiny/di` container
- 🔌 **Pluggable architecture** - swap implementations without changing business logic
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

```typescript
import { createImplementation } from "@webiny/di";
import { ApiGatewayEventHandler } from "@cloudi/aws";
import type { APIGatewayEvent, APIGatewayProxyResult } from "@cloudi/aws";

// Your handler implementation
class ListUsersHandler implements ApiGatewayEventHandler.Interface {
    constructor(private userService: IUserService) {}

    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        const users = await this.userService.listUsers();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ users })
        };
    }
}

// Export as implementation
export const listUsersHandler = createImplementation({
    abstraction: ApiGatewayEventHandler,
    implementation: ListUsersHandler,
    dependencies: [UserService]
});
```

### 2. Create Your Lambda Handler

```typescript
import { createFunction } from "@cloudi/aws";
import { listUsersHandler } from "./handlers/ListUsersHandler";
import { userService } from "./services/UserService";

export const handler = createFunction(async (container) => {
    // Register services
    container.register(userService).inSingletonScope();
    
    // Register handlers
    container.register(listUsersHandler).inSingletonScope();
});
```

### 3. Deploy and Invoke

Your Lambda function will automatically:
- ✅ Qualify incoming events (API Gateway, SNS, SQS, etc.)
- ✅ Route to the correct handler
- ✅ Inject dependencies
- ✅ Execute your business logic

## Core Concepts

### Event Handlers

Event handlers process specific AWS event types. Each handler implements an `execute` method:

```typescript
interface IApiGatewayEventHandler {
    execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult>;
}
```

**Available Handlers:**
- `ApiGatewayEventHandler` - API Gateway events
- `SnsEventHandler` - SNS notifications
- `SqsEventHandler` - SQS messages
- `S3EventHandler` - S3 bucket events
- `DynamoDBEventHandler` - DynamoDB streams
- `EventBridgeEventHandler` - EventBridge events
- `RawEventHandler` - Custom/unqualified events

### Event Qualifiers

Event qualifiers automatically detect the event type:

```typescript
// Automatically qualified as API Gateway
{
    "httpMethod": "GET",
    "path": "/users",
    "requestContext": { ... }
}
// → Routes to ApiGatewayEventHandler

// Automatically qualified as SNS
{
    "Records": [{ "EventSource": "aws:sns", ... }]
}
// → Routes to SnsEventHandler
```

### Dependency Injection

Use the DI container to manage dependencies:

```typescript
import { createImplementation, Abstraction } from "@webiny/di";

// Define abstraction
const Logger = new Abstraction<ILogger>("Logger");

// Create implementation
class ConsoleLogger implements ILogger {
    info(message: string): void {
        console.log(message);
    }
}

const logger = createImplementation({
    abstraction: Logger,
    implementation: ConsoleLogger,
    dependencies: []
});

// Register in container
container.register(logger).inSingletonScope();
```

### AWS Lambda Context

Access Lambda context and event in your services:

```typescript
import { AwsLambdaContext } from "@cloudi/aws";

class ContextAwareLogger implements ILogger {
    constructor(private context: Context) {}
    
    info(message: string): void {
        console.log({
            message,
            requestId: this.context.awsRequestId,
            functionName: this.context.functionName
        });
    }
}

const logger = createImplementation({
    abstraction: Logger,
    implementation: ContextAwareLogger,
    dependencies: [AwsLambdaContext]  // Automatically injected per invocation
});
```

## Examples

### Multi-Event Handler

Handle multiple event types in a single Lambda:

```typescript
export const handler = createFunction(async (container) => {
    // Services
    container.register(logger).inSingletonScope();
    container.register(userService).inSingletonScope();
    
    // Multiple handlers - event is automatically routed
    container.register(apiGatewayHandler).inSingletonScope();
    container.register(snsHandler).inSingletonScope();
    container.register(sqsHandler).inSingletonScope();
});
```

### Testing

Mock dependencies for easy testing:

```typescript
import { Container } from "@webiny/di";

describe("ListUsersHandler", () => {
    it("should list users", async () => {
        const container = new Container();
        
        // Mock user service
        const mockUserService = createImplementation({
            abstraction: UserService,
            implementation: class {
                async listUsers() {
                    return [{ id: "1", name: "Test" }];
                }
            },
            dependencies: []
        });
        
        container.register(mockUserService);
        container.register(listUsersHandler);
        
        const handler = container.resolve(ApiGatewayEventHandler);
        const result = await handler.execute(mockEvent);
        
        expect(result.statusCode).toBe(200);
    });
});
```

### Using with pino-lambda

Integrate with pino-lambda for structured logging:

```typescript
import pino from "pino";
import { pinoLambdaDestination } from "pino-lambda";
import { AwsLambdaContext } from "@cloudi/aws";

class PinoLogger implements ILogger {
    private logger: pino.Logger;
    private destination: any;
    
    constructor(context: Context) {
        this.destination = pinoLambdaDestination();
        this.logger = pino({}, this.destination);
        this.destination.setContext(context);
    }
    
    info(message: string, data?: any): void {
        this.logger.info(data || {}, message);
    }
}

const pinoLogger = createImplementation({
    abstraction: Logger,
    implementation: PinoLogger,
    dependencies: [AwsLambdaContext]
});
```

## Architecture

### Project Structure

```
src/
├── abstractions/
│   ├── handlers/           # Event handler abstractions
│   ├── qualifiers/         # Event qualifier abstractions
│   ├── AwsLambdaContext.ts
│   ├── AwsLambdaEvent.ts
│   └── createAbstraction.ts
│
└── features/
    └── qualifiers/         # Built-in event qualifier implementations
```

### How It Works

1. **Cold Start**: Container is initialized once
2. **Per Invocation**:
   - AWS Lambda provides `(event, context)`
   - Event is qualified (API Gateway? SNS? SQS?)
   - Correct handler(s) are resolved from container
   - Dependencies are injected
   - Handler executes business logic
   - Result is returned

```
AWS Lambda Invoke
       ↓
createFunction
       ↓
Event Qualification
       ↓
Handler Resolution (DI Container)
       ↓
Dependency Injection
       ↓
Handler.execute()
       ↓
Return Result
```

## API Reference

### Core Functions

#### `createFunction(setup: FunctionSetup)`

Creates a Lambda handler function.

```typescript
type FunctionSetup = (container: Container) => Promise<void> | void;

const handler = createFunction(async (container) => {
    // Register your implementations
});
```

### Abstractions

#### Event Handlers

- `ApiGatewayEventHandler` - API Gateway REST/HTTP
- `SnsEventHandler` - SNS topic notifications
- `SqsEventHandler` - SQS queue messages
- `S3EventHandler` - S3 bucket events
- `DynamoDBEventHandler` - DynamoDB streams
- `EventBridgeEventHandler` - EventBridge custom events
- `RawEventHandler` - Generic/custom events

#### Event Qualifiers

- `ApiGatewayEventQualifier` - Detects API Gateway events
- `SnsEventQualifier` - Detects SNS events
- `SqsEventQualifier` - Detects SQS events
- `S3EventQualifier` - Detects S3 events
- `DynamoDBEventQualifier` - Detects DynamoDB stream events
- `EventBridgeEventQualifier` - Detects EventBridge events

#### AWS Lambda

- `AwsLambdaContext` - Lambda execution context
- `AwsLambdaEvent` - Raw Lambda event

### Container API

Provided by `@webiny/di`:

```typescript
// Register implementation
container.register(implementation).inSingletonScope();

// Resolve single instance
const instance = container.resolve(Abstraction);

// Resolve all instances
const instances = container.resolveAll(Abstraction);
```

## Advanced Usage

### Custom Event Types

Create your own event handlers:

```typescript
import { Abstraction, createImplementation } from "@webiny/di";

// Define abstraction
interface ICustomEventHandler {
    execute(event: CustomEvent): Promise<CustomResult>;
}

const CustomEventHandler = new Abstraction<ICustomEventHandler>("CustomEventHandler");

// Implement handler
class MyCustomHandler implements ICustomEventHandler {
    async execute(event: CustomEvent): Promise<CustomResult> {
        // Your logic
    }
}

const customHandler = createImplementation({
    abstraction: CustomEventHandler,
    implementation: MyCustomHandler,
    dependencies: []
});
```

### Decorators

Add cross-cutting concerns using decorators:

```typescript
class LoggingDecorator implements ApiGatewayEventHandler.Interface {
    constructor(
        private decorated: ApiGatewayEventHandler.Interface,
        private logger: ILogger
    ) {}
    
    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        this.logger.info("Handler invoked", { path: event.path });
        const result = await this.decorated.execute(event);
        this.logger.info("Handler completed", { statusCode: result.statusCode });
        return result;
    }
}

container.registerDecorator(LoggingDecorator);
```

### Multiple Handlers

Register multiple handlers for the same event type:

```typescript
container.register(authHandler).inSingletonScope();
container.register(validationHandler).inSingletonScope();
container.register(businessLogicHandler).inSingletonScope();

// All handlers execute in parallel
const handlers = container.resolveAll(ApiGatewayEventHandler);
const results = await Promise.all(handlers.map(h => h.execute(event)));
```

## Best Practices

### ✅ Do

- Use dependency injection for all services
- Keep handlers focused on a single responsibility
- Register services in singleton scope when possible
- Use abstractions for testability
- Leverage TypeScript types for type safety

### ❌ Don't

- Don't create dependencies manually inside handlers
- Don't access global state or singletons directly
- Don't mix business logic with AWS-specific code
- Don't modify the Lambda context or event objects

## Migration Guide

### From Traditional Lambda Handlers

**Before:**

```typescript
export const handler = async (event: APIGatewayEvent) => {
    const userService = new UserService(
        new DynamoDBClient(),
        new Logger()
    );
    
    const users = await userService.listUsers();
    
    return {
        statusCode: 200,
        body: JSON.stringify({ users })
    };
};
```

**After:**

```typescript
// Define dependencies once
const dynamoClient = createImplementation({
    abstraction: DatabaseClient,
    implementation: DynamoDBClient,
    dependencies: []
});

const logger = createImplementation({
    abstraction: Logger,
    implementation: ConsoleLogger,
    dependencies: []
});

const userService = createImplementation({
    abstraction: UserService,
    implementation: UserServiceImpl,
    dependencies: [DatabaseClient, Logger]
});

const handler = createImplementation({
    abstraction: ApiGatewayEventHandler,
    implementation: ListUsersHandler,
    dependencies: [UserService]
});

// Compose in Lambda handler
export const lambdaHandler = createFunction(async (container) => {
    container.register(dynamoClient).inSingletonScope();
    container.register(logger).inSingletonScope();
    container.register(userService).inSingletonScope();
    container.register(handler).inSingletonScope();
});
```

## Troubleshooting

### Event not being qualified

If your event isn't being detected:

1. Check the event structure matches AWS event format
2. Verify qualifiers are registered in `createFunction`
3. Use `RawEventHandler` as a fallback

### Dependency not resolving

If a dependency isn't being injected:

1. Ensure the abstraction is registered in the container
2. Check the dependency array in `createImplementation`
3. Verify the abstraction is the same instance (not recreated)

### Multiple handlers executing

If multiple handlers are executing when you expect one:

- This is by design - all registered handlers for a qualified event type execute
- Use different event types or filter within handlers if needed

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Related Documentation

- [Folder Structure](./FOLDER_STRUCTURE.md) - Detailed project organization
- [AWS Lambda Abstractions](./src/abstractions/AWS_LAMBDA_ABSTRACTIONS.md) - Context and Event usage
- [Examples](./src/examples/) - Complete working examples
- [@webiny/di Documentation](https://www.npmjs.com/package/@webiny/di) - DI container API

## Support

- 🐛 [Report Issues](https://github.com/webiny/webiny-js/issues)
- 💬 [Discussions](https://github.com/webiny/webiny-js/discussions)
- 📖 [Documentation](https://www.webiny.com/docs)
