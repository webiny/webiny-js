# Migration Guide

## Migrating from Abstract Classes to Abstractions

This guide helps you migrate from the old abstract class pattern to the new abstraction pattern.

## Quick Comparison

### Before (Old Pattern)
```typescript
import { ApiGatewayFunction, createApiGatewayFunction } from "@cloudi/aws";

class MyFunction extends ApiGatewayFunction {
    async execute(event: APIGatewayEvent) {
        return { statusCode: 200, body: "OK" };
    }
}

export const handler = createApiGatewayFunction(MyFunction);
```

### After (New Pattern)
```typescript
import { ApiGatewayFunction, createFunction, createImplementation } from "@cloudi/aws";
import type { APIGatewayEvent, APIGatewayProxyResult } from "@cloudi/aws";

class MyFunction implements ApiGatewayFunction.Interface {
    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        return { statusCode: 200, body: "OK" };
    }
}

export const myFunction = createImplementation({
    abstraction: ApiGatewayFunction,
    implementation: MyFunction,
    dependencies: []
});

export const handler = createFunction(
    ApiGatewayFunction,
    async (container) => {
        container.register(myFunction).inSingletonScope();
    }
);
```

## Step-by-Step Migration

### 1. Update Imports

**Before:**
```typescript
import { 
    ApiGatewayFunction, 
    createApiGatewayFunction 
} from "@cloudi/aws";
```

**After:**
```typescript
import { 
    ApiGatewayFunction, 
    createFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult
} from "@cloudi/aws";
```

### 2. Change from `extends` to `implements`

**Before:**
```typescript
class ListUsersFunction extends ApiGatewayFunction {
    async execute(event: APIGatewayEvent) {
        // ...
    }
}
```

**After:**
```typescript
class ListUsersFunction implements ApiGatewayFunction.Interface {
    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        // ...
    }
}
```

### 3. Export Implementation with createImplementation

**After:**
```typescript
import { createImplementation, ApiGatewayFunction } from "@cloudi/aws";

class ListUsersFunction implements ApiGatewayFunction.Interface {
    constructor(
        private logger: LoggerService.Interface
    ) {}

    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        this.logger.info("Hello");
        // ...
    }
}

// Export using createImplementation
export const listUsersFunction = createImplementation({
    abstraction: ApiGatewayFunction,
    implementation: ListUsersFunction,
    dependencies: [LoggerService]
});
```

### 4. Update Function Registration

**Before:**
```typescript
export const handler = createApiGatewayFunction(
    ListUsersFunction,
    async (container) => {
        // setup
    }
);
```

**After:**
```typescript
export const handler = createFunction(
    ApiGatewayFunction,
    async (container) => {
        // Register services
        container.register(consoleLogger).inSingletonScope();
        
        // Register function
        container.register(listUsersFunction).inSingletonScope();
    }
);
```

## Function Type Migrations

### API Gateway

**Before:**
```typescript
import { ApiGatewayFunction, createApiGatewayFunction } from "@cloudi/aws";

class MyFunction extends ApiGatewayFunction {
    async execute(event) { /* ... */ }
}

export const handler = createApiGatewayFunction(MyFunction);
```

**After:**
```typescript
import { ApiGatewayFunction, createFunction, createImplementation } from "@cloudi/aws";

class MyFunction implements ApiGatewayFunction.Interface {
    async execute(event) { /* ... */ }
}

export const myFunction = createImplementation({
    abstraction: ApiGatewayFunction,
    implementation: MyFunction,
    dependencies: []
});

export const handler = createFunction(
    ApiGatewayFunction,
    async (container) => {
        container.register(myFunction).inSingletonScope();
    }
);
```

### SNS

**Before:**
```typescript
import { SnsFunction, createSnsFunction } from "@cloudi/aws";

class MyFunction extends SnsFunction {
    async execute(event) { /* ... */ }
}

export const handler = createSnsFunction(MyFunction);
```

**After:**
```typescript
import { SnsFunction, createFunction, createImplementation } from "@cloudi/aws";

class MyFunction implements SnsFunction.Interface {
    async execute(event) { /* ... */ }
}

export const myFunction = createImplementation({
    abstraction: SnsFunction,
    implementation: MyFunction,
    dependencies: []
});

export const handler = createFunction(
    SnsFunction,
    async (container) => {
        container.register(myFunction).inSingletonScope();
    }
);
```

### S3

**Before:**
```typescript
import { S3Function, createS3Function } from "@cloudi/aws";

class MyFunction extends S3Function {
    async execute(event) { /* ... */ }
}

export const handler = createS3Function(MyFunction);
```

**After:**
```typescript
import { S3Function, createFunction, createImplementation } from "@cloudi/aws";

class MyFunction implements S3Function.Interface {
    async execute(event) { /* ... */ }
}

export const myFunction = createImplementation({
    abstraction: S3Function,
    implementation: MyFunction,
    dependencies: []
});

export const handler = createFunction(
    S3Function,
    async (container) => {
        container.register(myFunction).inSingletonScope();
    }
);
```

### SQS

**Before:**
```typescript
import { SqsFunction, createSqsFunction } from "@cloudi/aws";

class MyFunction extends SqsFunction {
    async execute(event) { /* ... */ }
}

export const handler = createSqsFunction(MyFunction);
```

**After:**
```typescript
import { SqsFunction, createFunction, createImplementation } from "@cloudi/aws";

class MyFunction implements SqsFunction.Interface {
    async execute(event) { /* ... */ }
}

export const myFunction = createImplementation({
    abstraction: SqsFunction,
    implementation: MyFunction,
    dependencies: []
});

export const handler = createFunction(
    SqsFunction,
    async (container) => {
        container.register(myFunction).inSingletonScope();
    }
);
```

### DynamoDB Streams

**Before:**
```typescript
import { DynamoDBFunction, createDynamoDBFunction } from "@cloudi/aws";

class MyFunction extends DynamoDBFunction {
    async execute(event) { /* ... */ }
}

export const handler = createDynamoDBFunction(MyFunction);
```

**After:**
```typescript
import { DynamoDBFunction, createFunction, createImplementation } from "@cloudi/aws";

class MyFunction implements DynamoDBFunction.Interface {
    async execute(event) { /* ... */ }
}

export const myFunction = createImplementation({
    abstraction: DynamoDBFunction,
    implementation: MyFunction,
    dependencies: []
});

export const handler = createFunction(
    DynamoDBFunction,
    async (container) => {
        container.register(myFunction).inSingletonScope();
    }
);
```

### EventBridge

**Before:**
```typescript
import { EventBridgeFunction, createEventBridgeFunction } from "@cloudi/aws";

class MyFunction extends EventBridgeFunction {
    async execute(event) { /* ... */ }
}

export const handler = createEventBridgeFunction(MyFunction);
```

**After:**
```typescript
import { EventBridgeFunction, createFunction, createImplementation } from "@cloudi/aws";

class MyFunction implements EventBridgeFunction.Interface {
    async execute(event) { /* ... */ }
}

export const myFunction = createImplementation({
    abstraction: EventBridgeFunction,
    implementation: MyFunction,
    dependencies: []
});

export const handler = createFunction(
    EventBridgeFunction,
    async (container) => {
        container.register(myFunction).inSingletonScope();
    }
);
```

## Common Issues

### Issue: "Cannot find name 'ApiGatewayFunction'"

Make sure you're importing the abstraction:
```typescript
import { ApiGatewayFunction } from "@cloudi/aws";
```

### Issue: Type errors with event types

Import the types explicitly:
```typescript
import type { APIGatewayEvent, APIGatewayProxyResult } from "@cloudi/aws";
```

### Issue: "Property 'container' does not exist"

The new pattern doesn't expose the container to the function. Use constructor injection:
```typescript
class MyFunction implements ApiGatewayFunction.Interface {
    constructor(
        private service: MyService.Interface
    ) {}
}
```

## Breaking Changes

1. ❌ Removed: `CloudFunction` abstract class
2. ❌ Removed: `createApiGatewayFunction()`, `createSnsFunction()`, etc.
3. ❌ Removed: Helper methods like `processRecords()`, `success()`, `failure()`
4. ✅ Added: Single `createFunction()` for all types
5. ✅ Added: Abstraction pattern using `@webiny/di`
6. ✅ Added: Explicit composition root in setup callback

## Benefits of Migration

1. ✅ **Better Dependency Injection**: Full control over DI container
2. ✅ **Type Safety**: Interfaces instead of abstract classes
3. ✅ **Testability**: Easy to mock dependencies
4. ✅ **Consistency**: Matches `@webiny/project` pattern
5. ✅ **Flexibility**: Single composition root for all registrations
6. ✅ **Clarity**: Clear separation between abstractions and implementations

