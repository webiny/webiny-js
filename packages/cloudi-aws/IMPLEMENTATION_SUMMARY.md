# Middleware Pattern Implementation Summary

## What Changed

Successfully migrated from `canUse` pattern to **Express-like middleware pattern** for AWS Lambda event handling in `@cloudi/aws`.

## Changes Made

### 1. Core Types (`types.ts`)
- ✅ Added `NextFunction` type for middleware chain

### 2. Core Function Handler (`createFunction.ts`)
- ✅ Removed `canUse` detection logic
- ✅ Implemented middleware chain pattern
- ✅ Each handler receives `(event, next)` parameters
- ✅ Handlers call `next()` to pass control to next handler

### 3. All Function Abstractions Updated
- ✅ **ApiGatewayFunction** - HTTP/REST API requests
- ✅ **SnsFunction** - SNS topic messages
- ✅ **SqsFunction** - SQS queue messages
- ✅ **S3Function** - S3 bucket events
- ✅ **EventBridgeFunction** - EventBridge events
- ✅ **DynamoDBFunction** - DynamoDB Stream events
- ✅ **RawFunction** - Custom/raw events

All abstractions now:
- Accept `NextFunction` as second parameter in `execute()`
- Use direct `Abstraction` class instead of `createAbstraction` helper
- Removed `canUse` static methods
- Keep `createImplementation` helper for user convenience

### 4. Example Implementations Updated
- ✅ `ListUsersFunction.example.ts` - Shows middleware pattern with `next()`
- ✅ `ProcessOrderFunction.example.ts` - Shows SNS with middleware
- ✅ `myTest/ListUsersFunction.ts` - Working test implementation
- ✅ `myTest/handler.ts` - Composition root example

### 5. Documentation Created
- ✅ `MIDDLEWARE_PATTERN.md` - Comprehensive guide
- ✅ `examples/multi-event-handler.example.ts` - Complete working example
- ✅ `README.md` - Updated with middleware pattern

## Migration Guide

### Before (canUse pattern)

```typescript
// Abstraction
export namespace ApiGatewayFunction {
    export function canUse(event: any): event is APIGatewayEvent {
        return !!event.httpMethod && !!event.requestContext;
    }
}

// Implementation
async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const users = await this.userService.listUsers();
    return { statusCode: 200, body: JSON.stringify(users) };
}

// Framework (automatic)
const handler = handlers.find(h => h.canUse(event));
return handler.execute(event);
```

### After (middleware pattern)

```typescript
// Abstraction (no canUse needed)
export interface IApiGatewayFunction {
    execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult>;
}

// Implementation
async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
    // Middleware check - call next() if can't handle
    if (!event.httpMethod) {
        return next();
    }
    
    const users = await this.userService.listUsers();
    return { statusCode: 200, body: JSON.stringify(users) };
}

// Framework (middleware chain)
const next = () => {
    const handler = handlers[index++];
    return handler.execute(event, next);
};
return next();
```

## Key Benefits

### 1. **Express-like Developer Experience**
```typescript
if (!event.httpMethod) {
    return next(); // Familiar pattern!
}
```

### 2. **Flexible Event Detection**
Handlers can use sophisticated logic to decide if they should process:
```typescript
// Check event type
if (!event.httpMethod) return next();

// Check specific route
if (event.path !== "/api/users") return next();

// Check HTTP method
if (event.httpMethod !== "GET") return next();

// This handler ONLY processes: GET /api/users
```

### 3. **Single Lambda, Multiple Triggers**
```typescript
export const handler = createFunction((container) => {
    // Register handlers in order
    container.register(ApiGatewayHandler);  // Checks first
    container.register(SnsHandler);         // Checks second
    container.register(S3Handler);          // Checks third
});

// Deploy with API Gateway + SNS + S3 triggers
// Middleware automatically routes to correct handler!
```

### 4. **Type-Safe Chain**
TypeScript ensures:
- ✅ Each handler implements correct interface
- ✅ `next()` returns correct type
- ✅ Event types are properly typed
- ✅ Dependencies are correctly injected

## Example Flow

```
AWS Lambda receives event
    ↓
createFunction handler invoked
    ↓
Middleware chain starts
    ↓
Handler 1: ListUsersHandler.execute(event, next)
    ├─ Check: event.httpMethod exists?
    ├─ NO → return next()
    ↓
Handler 2: ProcessOrderHandler.execute(event, next)
    ├─ Check: event.Records[0].EventSource === "aws:sns"?
    ├─ YES → Process SNS event
    ├─ Return result
    ✓
Result returned to AWS Lambda runtime
```

## Testing

All TypeScript compilation passes:
```bash
npx tsc --noEmit --skipLibCheck
# No errors! ✅
```

## Future Enhancements

Planned features:
- [ ] Route-based API Gateway handlers (multiple routes per Lambda)
- [ ] Middleware composition (auth, logging, etc.)
- [ ] Error handling middleware
- [ ] Response transformation pipeline
- [ ] Conditional middleware registration

## Files Changed

### Core
- `src/types.ts` - Added `NextFunction`
- `src/createFunction.ts` - Middleware chain implementation
- `src/index.ts` - Export `NextFunction`

### Abstractions
- `src/abstractions/ApiGatewayFunction.ts`
- `src/abstractions/SnsFunction.ts`
- `src/abstractions/SqsFunction.ts`
- `src/abstractions/S3Function.ts`
- `src/abstractions/EventBridgeFunction.ts`
- `src/abstractions/DynamoDBFunction.ts`
- `src/abstractions/RawFunction.ts`

### Examples
- `src/features/ListUsersFunction.example.ts`
- `src/features/ProcessOrderFunction.example.ts`
- `src/myTest/ListUsersFunction.ts`
- `src/examples/multi-event-handler.example.ts` (NEW)

### Documentation
- `README.md` - Updated
- `MIDDLEWARE_PATTERN.md` (NEW) - Complete guide

## Status

✅ **COMPLETE** - Middleware pattern fully implemented and documented!

All handlers now use the middleware pattern with `next()` for flexible event routing.

