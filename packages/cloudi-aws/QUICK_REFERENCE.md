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

// 3. Register with container
container.register(ListUsersFunction).inSingletonScope();
```

## Available Functions

| Type | Usage |
|------|-------|
| API Gateway | `ApiGatewayFunction.createImplementation({ ... })` |
| SNS | `SnsFunction.createImplementation({ ... })` |
| S3 | `S3Function.createImplementation({ ... })` |
| SQS | `SqsFunction.createImplementation({ ... })` |
| DynamoDB | `DynamoDBFunction.createImplementation({ ... })` |
| EventBridge | `EventBridgeFunction.createImplementation({ ... })` |
| Raw/Generic | `RawFunction.createImplementation({ ... })` |

## Naming Rules

✅ Class: `MyFunctionImpl`  
✅ Export: `export const MyFunction`  
✅ File: `MyFunction.ts`

## Handler Template

```typescript
import { createFunction, ApiGatewayFunction } from "@cloudi/aws";
import { MyFunction } from "~/features/MyFunction";

export const handler = createFunction(
    ApiGatewayFunction,
    async (container) => {
        // Register your implementations
        container.register(MyFunction).inSingletonScope();
    }
);
```

