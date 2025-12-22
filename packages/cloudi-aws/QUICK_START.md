# Quick Reference: EventQualifier Pattern

## Basic Handler Structure

```typescript
import { createImplementation } from "@webiny/di";
import { ApiGatewayEventHandler } from "@cloudi/aws";

// 1. Define your handler class
export class MyHandler implements ApiGatewayEventHandler.Interface {
    constructor(private myService: MyService.Interface) {}

    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        // Just handle the event - no need to check event type!
        const result = await this.myService.doSomething();
        
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    }
}

// 2. Export using createImplementation
export const myHandler = createImplementation({
    abstraction: ApiGatewayEventHandler,
    implementation: MyHandler,
    dependencies: [MyService]
});
```

## Event Handler Abstractions

| Event Type | Handler Abstraction | Event Type |
|------------|-------------------|------------|
| API Gateway | `ApiGatewayEventHandler` | `APIGatewayEvent` |
| SNS | `SnsEventHandler` | `SNSEvent` |
| SQS | `SqsEventHandler` | `SQSEvent` |
| S3 | `S3EventHandler` | `S3Event` |
| EventBridge | `EventBridgeEventHandler` | `EventBridgeEvent` |
| DynamoDB | `DynamoDBEventHandler` | `DynamoDBStreamEvent` |
| Raw/Custom | `RawEventHandler` | `any` |

## Event Qualifier Pattern

Qualifiers automatically inspect events to determine their type:

```typescript
// Built-in qualifiers (registered automatically)
ApiGatewayEventQualifier  → checks for event.httpMethod
SnsEventQualifier         → checks for Records[0].EventSource === "aws:sns"
SqsEventQualifier         → checks for Records[0].eventSource === "aws:sqs"
S3EventQualifier          → checks for Records[0].eventSource === "aws:s3"
EventBridgeEventQualifier → checks for event.source && event["detail-type"]
DynamoDBEventQualifier    → checks for Records[0].eventSource === "aws:dynamodb"
```

## Multi-Event Handler

```typescript
import { createFunction } from "@cloudi/aws";
import { listUsersHandler } from "./features/ListUsersHandler";
import { processOrderHandler } from "./features/ProcessOrderHandler";

export const handler = createFunction((container) => {
    // Register services
    container.register(logger).inSingletonScope();
    container.register(userService).inSingletonScope();
    container.register(orderService).inSingletonScope();

    // Register handlers
    // Qualifiers route events automatically!
    container.register(listUsersHandler).inSingletonScope();    // API Gateway
    container.register(processOrderHandler).inSingletonScope(); // SNS
});
```

## How It Works

```
1. Event arrives at Lambda
   ↓
2. createFunction runs event through qualifiers
   ↓
3. ApiGatewayEventQualifier.execute(event) → true ✓
   ↓
4. Get all ApiGatewayEventHandler implementations
   ↓
5. Execute handlers: listUsersHandler.execute(event)
   ↓
6. Return result
```

## Imports

```typescript
// Core
import { createFunction } from "@cloudi/aws";
import { createImplementation } from "@webiny/di";

// Event Handlers
import {
    ApiGatewayEventHandler,
    SnsEventHandler,
    SqsEventHandler,
    S3EventHandler,
    EventBridgeEventHandler,
    DynamoDBEventHandler,
    RawEventHandler
} from "@cloudi/aws";

// Event Types
import type {
    APIGatewayEvent,
    APIGatewayProxyResult,
    SNSEvent,
    SQSEvent,
    S3Event,
    EventBridgeEvent,
    DynamoDBStreamEvent
} from "@cloudi/aws";
```

## Complete Example

```typescript
// features/ListUsersHandler.ts
import { createImplementation } from "@webiny/di";
import { ApiGatewayEventHandler, type APIGatewayEvent } from "@cloudi/aws";

export class ListUsersHandler implements ApiGatewayEventHandler.Interface {
    constructor(
        private userService: UserService.Interface,
        private logger: LoggerService.Interface
    ) {}

    async execute(event: APIGatewayEvent) {
        this.logger.info("Listing users");
        const users = await this.userService.listUsers();
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ users })
        };
    }
}

export const listUsersHandler = createImplementation({
    abstraction: ApiGatewayEventHandler,
    implementation: ListUsersHandler,
    dependencies: [UserService, LoggerService]
});
```

```typescript
// handler.ts
import { createFunction } from "@cloudi/aws";
import { listUsersHandler } from "./features/ListUsersHandler";
import { logger, userService } from "./services";

export const handler = createFunction((container) => {
    container.register(logger).inSingletonScope();
    container.register(userService).inSingletonScope();
    container.register(listUsersHandler).inSingletonScope();
});
```

## Benefits

✅ **No event checking in handlers** - Qualifiers handle it  
✅ **Clean separation** - Qualifiers vs Handlers  
✅ **Type-safe** - Full TypeScript support  
✅ **Multiple handlers** - Register many handlers per event type  
✅ **Auto-routing** - Events automatically go to right handlers  

## Comparison

### Before (Middleware)
```typescript
async execute(event, next) {
    if (!event.httpMethod) return next(); // ❌ Manual checking
    // handle...
}
```

### After (Qualifier)
```typescript
async execute(event) {
    // ✅ Just handle! Already qualified
}
```

