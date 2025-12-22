# Middleware Pattern in @cloudi/aws

This document explains the middleware pattern used in `@cloudi/aws` for handling AWS Lambda events.

## Overview

Instead of using a `canUse` method to detect which handler should process an event, we use an **Express-like middleware pattern** where each handler decides whether to process the event or pass it to the next handler in the chain.

## How It Works

Each function implementation receives two parameters:
1. `event` - The AWS Lambda event
2. `next` - A function to call the next handler in the chain

If a handler cannot process the event, it calls `next()` to pass control to the next handler.

## Example: API Gateway Function

```typescript
import {
    ApiGatewayFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type NextFunction
} from "@cloudi/aws";

export class ListUsersFunctionImpl implements ApiGatewayFunction.Interface {
    constructor(
        private userService: UserService.Interface,
        private logger: LoggerService.Interface
    ) {}

    async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
        // Middleware pattern: check if this handler can process the event
        if (!event.httpMethod) {
            return next(); // Not an API Gateway event, pass to next handler
        }

        // Process the event
        this.logger.info("Handling API Gateway request");
        const users = await this.userService.listUsers();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, data: users })
        };
    }
}

// Export using createImplementation
export const ListUsersFunction = ApiGatewayFunction.createImplementation({
    implementation: ListUsersFunctionImpl,
    dependencies: [UserService, LoggerService]
});
```

## Example: SNS Function

```typescript
import {
    SnsFunction,
    type SNSEvent,
    type SnsResult,
    type NextFunction
} from "@cloudi/aws";

export class ProcessOrderFunctionImpl implements SnsFunction.Interface {
    constructor(
        private orderService: OrderService.Interface,
        private logger: LoggerService.Interface
    ) {}

    async execute(event: SNSEvent, next: NextFunction): Promise<SnsResult> {
        // Middleware pattern: check if this is an SNS event
        if (!Array.isArray(event.Records) || event.Records[0]?.EventSource !== "aws:sns") {
            return next(); // Not an SNS event, pass to next handler
        }

        // Process the SNS event
        this.logger.info("Processing SNS event");
        
        for (const record of event.Records) {
            const message = JSON.parse(record.Sns.Message);
            await this.orderService.processOrder(message.orderId, message);
        }

        return {
            success: true,
            processedRecords: event.Records.length
        };
    }
}

export const ProcessOrderFunction = SnsFunction.createImplementation({
    implementation: ProcessOrderFunctionImpl,
    dependencies: [OrderService, LoggerService]
});
```

## Single Handler, Multiple Event Types

The real power of the middleware pattern is that you can register multiple handlers in a single Lambda function, and the framework will automatically route events to the correct handler:

```typescript
import { createFunction } from "@cloudi/aws";
import { ListUsersFunction } from "./features/ListUsersFunction";
import { ProcessOrderFunction } from "./features/ProcessOrderFunction";
import { ConsoleLogger, DynamoDbUserService, DynamoDbOrderService } from "./services";

// Single handler that can handle BOTH API Gateway AND SNS events!
export const handler = createFunction((container) => {
    // Register services
    container.register(ConsoleLogger).inSingletonScope();
    container.register(DynamoDbUserService).inSingletonScope();
    container.register(DynamoDbOrderService).inSingletonScope();

    // Register multiple function implementations
    container.register(ListUsersFunction).inSingletonScope();      // Handles API Gateway
    container.register(ProcessOrderFunction).inSingletonScope();   // Handles SNS
});
```

### Deployment

You can deploy this single Lambda function with multiple triggers:

```typescript
// In your infrastructure code (e.g., Pulumi)
const lambda = new aws.lambda.Function("multi-handler", {
    runtime: "nodejs20.x",
    handler: "handler.handler",
    code: pulumi.asset.FileArchive("./dist"),
    // ... other config
});

// Attach API Gateway trigger
const apiGateway = new aws.apigatewayv2.Api("http-api", {
    protocolType: "HTTP",
    target: lambda.arn
});

// Attach SNS trigger
const topic = new aws.sns.Topic("orders");
new aws.sns.TopicSubscription("orders-subscription", {
    topic: topic.arn,
    protocol: "lambda",
    endpoint: lambda.arn
});
```

### How the Middleware Chain Works

When an event arrives:

1. The `createFunction` handler receives the event
2. It starts the middleware chain with the first registered handler
3. If the first handler calls `next()`, control passes to the second handler
4. This continues until a handler processes the event and returns a result
5. If no handler processes the event, an error is thrown

```
Event arrives
    ↓
ListUsersFunction.execute(event, next)
    ↓ (checks event.httpMethod)
    ↓ (if not API GW) → next()
    ↓
ProcessOrderFunction.execute(event, next)
    ↓ (checks event.Records[0].EventSource)
    ↓ (if SNS) → Process and return
    ✓
Result returned to Lambda runtime
```

## Available Function Abstractions

- **ApiGatewayFunction** - HTTP/REST API requests
- **SnsFunction** - SNS topic messages
- **SqsFunction** - SQS queue messages
- **S3Function** - S3 bucket events
- **EventBridgeFunction** - EventBridge events
- **DynamoDBFunction** - DynamoDB Stream events
- **RawFunction** - Custom/raw events

## Comparison with Old Pattern

### Old Pattern (canUse)

```typescript
// Framework code
const handler = handlers.find(h => h.canUse(event));
if (!handler) throw new Error("No handler found");
return handler.execute(event);
```

### New Pattern (Middleware)

```typescript
// Framework code
const next = async () => {
    const handler = handlers[currentIndex++];
    if (!handler) throw new Error("No handler processed event");
    return handler.execute(event, next);
};
return next();

// User code
async execute(event, next) {
    if (!this.canHandle(event)) {
        return next(); // Express-like!
    }
    // Process event
}
```

## Benefits

1. **Express-like API** - Familiar pattern for developers
2. **Flexible routing** - Handlers can inspect events in detail before deciding
3. **Composable** - Easy to add custom middleware logic
4. **Single deployment** - One Lambda handles multiple event types
5. **Type-safe** - Full TypeScript support with proper typing

## Best Practices

### ✅ DO: Check event structure early

```typescript
async execute(event: APIGatewayEvent, next: NextFunction) {
    if (!event.httpMethod) {
        return next();
    }
    // Process event
}
```

### ✅ DO: Use specific checks

```typescript
async execute(event: SNSEvent, next: NextFunction) {
    if (!Array.isArray(event.Records) || event.Records[0]?.EventSource !== "aws:sns") {
        return next();
    }
    // Process event
}
```

### ❌ DON'T: Process events you can't handle

```typescript
async execute(event: any, next: NextFunction) {
    // BAD: No check, just assume it's the right event
    const message = event.Records[0].Sns.Message; // Could crash!
}
```

### ❌ DON'T: Forget to call next()

```typescript
async execute(event: APIGatewayEvent, next: NextFunction) {
    if (!event.httpMethod) {
        return; // BAD: Should call next()
    }
    // Process event
}
```

## Advanced: Custom Event Validation

You can create more sophisticated validation:

```typescript
async execute(event: APIGatewayEvent, next: NextFunction) {
    // Check event type
    if (!event.httpMethod) {
        return next();
    }
    
    // Check specific route
    if (event.path !== "/api/users" || event.httpMethod !== "GET") {
        return next();
    }
    
    // This handler ONLY processes: GET /api/users
    const users = await this.userService.listUsers();
    return {
        statusCode: 200,
        body: JSON.stringify({ users })
    };
}
```

## Future Enhancements

Planned features for the middleware pattern:

- **Route-based API Gateway handlers** - Register multiple routes in a single function
- **Middleware composition** - Add cross-cutting concerns (logging, auth, etc.)
- **Error handling middleware** - Catch and transform errors
- **Response transformation** - Modify responses in a pipeline

