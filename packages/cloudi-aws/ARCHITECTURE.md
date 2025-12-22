# Middleware Pattern - Visual Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Lambda Runtime                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              createFunction Handler                  │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │         Middleware Chain                     │   │   │
│  │  │                                               │   │   │
│  │  │  Handler 1 → next() → Handler 2 → next() →  │   │   │
│  │  │  Handler 3 → ✓ Returns Result               │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │         DI Container                         │   │   │
│  │  │                                               │   │   │
│  │  │  • Services (Logger, UserService, etc.)     │   │   │
│  │  │  • Handlers (ApiGW, SNS, S3, etc.)          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow Diagram

### API Gateway Event

```
┌──────────────────┐
│  API Gateway     │
│  Event           │
│  {               │
│    httpMethod,   │
│    path,         │
│    ...           │
│  }               │
└────────┬─────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│  Handler 1: ListUsersHandler                           │
│                                                         │
│  execute(event, next) {                               │
│    if (!event.httpMethod) {  ← CHECK                  │
│      return next();         ← PASS TO NEXT            │
│    }                                                   │
│    // ✓ Can handle!                                   │
│    return processRequest();  ← HANDLE & RETURN        │
│  }                                                     │
└────────────────────────────────────────────────────────┘
         │
         ↓
    ┌────────┐
    │ Result │
    └────────┘
```

### SNS Event (passes through API Gateway handler first)

```
┌──────────────────┐
│  SNS Event       │
│  {               │
│    Records: [{   │
│      EventSource,│
│      Sns: {...}  │
│    }]            │
│  }               │
└────────┬─────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│  Handler 1: ListUsersHandler                           │
│                                                         │
│  execute(event, next) {                               │
│    if (!event.httpMethod) {  ← CHECK                  │
│      return next();         ← ✓ PASS TO NEXT          │
│    }                                                   │
│  }                                                     │
└────────┬───────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│  Handler 2: ProcessOrderHandler                        │
│                                                         │
│  execute(event, next) {                               │
│    if (Records[0]?.EventSource !== "aws:sns") {       │
│      return next();         ← WOULD PASS TO NEXT      │
│    }                                                   │
│    // ✓ Can handle!                                   │
│    return processOrder();    ← HANDLE & RETURN        │
│  }                                                     │
└────────────────────────────────────────────────────────┘
         │
         ↓
    ┌────────┐
    │ Result │
    └────────┘
```

## Comparison: Before vs After

### Before: canUse Pattern

```
┌─────────────┐
│   Event     │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Framework loops through handlers    │
│                                       │
│  for (handler of handlers) {         │
│    if (handler.canUse(event)) {      │
│      return handler.execute(event);  │
│    }                                  │
│  }                                    │
└──────────────────────────────────────┘
       │
       ↓
  ┌────────┐
  │ Result │
  └────────┘

❌ Issues:
- canUse logic separate from handler
- Less flexible
- Not Express-like
```

### After: Middleware Pattern

```
┌─────────────┐
│   Event     │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Handler 1                            │
│  execute(event, next) {              │
│    if (!canHandle(event)) {          │
│      return next();  ← Chain!        │
│    }                                  │
│    return process(event);            │
│  }                                    │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Handler 2                            │
│  execute(event, next) {              │
│    if (!canHandle(event)) {          │
│      return next();  ← Chain!        │
│    }                                  │
│    return process(event);            │
│  }                                    │
└──────┬───────────────────────────────┘
       │
       ↓
  ┌────────┐
  │ Result │
  └────────┘

✅ Benefits:
- Express-like pattern
- Handler controls flow
- More flexible
- Better composition
```

## Multi-Trigger Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Infrastructure                        │
│                                                               │
│  ┌──────────────┐                                           │
│  │ API Gateway  │───┐                                       │
│  └──────────────┘   │                                       │
│                      │                                       │
│  ┌──────────────┐   │      ┌──────────────────────────┐   │
│  │  SNS Topic   │───┼─────→│   Lambda Function        │   │
│  └──────────────┘   │      │                          │   │
│                      │      │  • ApiGatewayHandler     │   │
│  ┌──────────────┐   │      │  • SnsHandler            │   │
│  │  S3 Bucket   │───┘      │  • S3Handler             │   │
│  └──────────────┘          │                          │   │
│                             │  Middleware routes!      │   │
│                             └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Benefits:
✓ Single deployment
✓ Shared dependencies
✓ Less cold starts
✓ Easier maintenance
✓ Cost optimization
```

## Code Structure

```
my-lambda/
├── handler.ts                  ← Composition root
│   export const handler = createFunction((container) => {
│     container.register(Logger);
│     container.register(ListUsersHandler);     ← Handler 1
│     container.register(ProcessOrderHandler);  ← Handler 2
│     container.register(ProcessFileHandler);   ← Handler 3
│   });
│
├── features/
│   ├── ListUsersHandler.ts     ← API Gateway
│   │   execute(event, next) {
│   │     if (!event.httpMethod) return next();
│   │     // handle API request
│   │   }
│   │
│   ├── ProcessOrderHandler.ts  ← SNS
│   │   execute(event, next) {
│   │     if (Records[0]?.EventSource !== "aws:sns") return next();
│   │     // handle SNS event
│   │   }
│   │
│   └── ProcessFileHandler.ts   ← S3
│       execute(event, next) {
│         if (Records[0]?.eventSource !== "aws:s3") return next();
│         // handle S3 event
│       }
│
└── services/
    ├── Logger.ts
    ├── UserService.ts
    └── ...
```

## Execution Timeline

```
Time →

Cold Start (first invocation):
├─ Container initialized
├─ Services registered
├─ Handlers registered
└─ Middleware chain ready
   └─ Event processed ← 200-500ms

Warm Start (subsequent):
└─ Event processed ← 5-50ms
   (container & handlers reused!)
```

## Summary

The middleware pattern provides:

1. **Express-like API** - Familiar `next()` pattern
2. **Flexible routing** - Each handler decides
3. **Single deployment** - Multiple event types
4. **Better composition** - Easy to extend
5. **Type safety** - Full TypeScript support

It's like Express.js middleware, but for AWS Lambda events!

