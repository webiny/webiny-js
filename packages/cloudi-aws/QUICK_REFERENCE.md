# Quick Reference

## Pattern at a Glance

```typescript
// 1. Class with Impl suffix
export class ListUsersFunctionImpl implements ApiGatewayFunction.Interface {
    constructor(private userService: UserService.Interface) {}
    async execute(event) { /* ... */ }
}

// 2. Export with Capital letter using FunctionType.createImplementation
export const ListUsersFunction = ApiGatewayFunction.createImplementation({
    implementation: ListUsersFunctionImpl,
    dependencies: [UserService]
});

// 3. Register with container - NO abstraction parameter!
export const handler = createFunction(async (container) => {
    container.register(UserService).inSingletonScope();
    container.register(ListUsersFunction).inSingletonScope();
});
```

## Auto-Detection Magic ✨

The handler **automatically detects** which function to execute based on the AWS event:

```typescript
export const handler = createFunction(async (container) => {
    // Register services
    container.register(UserService).inSingletonScope();
    container.register(OrderService).inSingletonScope();
    
    // Register multiple handlers - they auto-detect!
    container.register(ListUsersFunction).inSingletonScope();      // API Gateway
    container.register(ProcessOrderFunction).inSingletonScope();   // SNS
    container.register(ResizeImageFunction).inSingletonScope();    // S3
});

// One Lambda, multiple triggers! 🚀
```

## Available Functions

| Type | Usage | Detects |
|------|-------|---------|
| API Gateway | `ApiGatewayFunction.createImplementation({ ... })` | `event.httpMethod` |
| SNS | `SnsFunction.createImplementation({ ... })` | `event.Records[0].EventSource === "aws:sns"` |
| S3 | `S3Function.createImplementation({ ... })` | `event.Records[0].eventSource === "aws:s3"` |
| SQS | `SqsFunction.createImplementation({ ... })` | `event.Records[0].eventSource === "aws:sqs"` |
| DynamoDB | `DynamoDBFunction.createImplementation({ ... })` | `event.Records[0].eventSource === "aws:dynamodb"` |
| EventBridge | `EventBridgeFunction.createImplementation({ ... })` | `event.source && event["detail-type"]` |
| Raw/Generic | `RawFunction.createImplementation({ ... })` | Always (fallback) |

## Naming Rules

✅ Class: `MyFunctionImpl`  
✅ Export: `export const MyFunction`  
✅ File: `MyFunction.ts`

## Handler Template

```typescript
import { createFunction } from "@cloudi/aws";
import { MyFunction, AnotherFunction } from "~/features";

export const handler = createFunction(async (container) => {
    // Register your implementations
    // Handler auto-detects which one to execute!
    container.register(MyFunction).inSingletonScope();
    container.register(AnotherFunction).inSingletonScope();
});
```

