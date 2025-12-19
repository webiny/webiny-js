# How Auto-Detection Works

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Event Arrives                         │
│  (API Gateway / SNS / S3 / SQS / DynamoDB / EventBridge)    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Lambda Handler Receives Event                 │
│                                                              │
│   export const handler = createFunction(async (container) => {│
│       container.register(ListUsersFunction);                │
│       container.register(ProcessOrderFunction);             │
│       container.register(ResizeImageFunction);              │
│   });                                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Check Registered Implementations                  │
│                                                              │
│   1. ListUsersFunction (API Gateway)                        │
│      ├─ canUse(event)? → Check event.httpMethod            │
│      └─ Result: ✅ MATCH (if API Gateway event)            │
│                                                              │
│   2. ProcessOrderFunction (SNS)                             │
│      ├─ canUse(event)? → Check Records[0].EventSource      │
│      └─ Result: ❌ No match                                 │
│                                                              │
│   3. ResizeImageFunction (S3)                               │
│      ├─ canUse(event)? → Check Records[0].eventSource      │
│      └─ Result: ❌ No match                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Resolve from DI Container                       │
│                                                              │
│   container.resolve(ApiGatewayFunction)                     │
│   ↓                                                          │
│   Returns: ListUsersFunctionImpl instance                   │
│            with injected dependencies                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Execute Handler                             │
│                                                              │
│   functionInstance.execute(event)                           │
│   ↓                                                          │
│   Business logic runs with DI                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Return Result                              │
│                                                              │
│   API Gateway: { statusCode: 200, body: "..." }            │
│   SNS: { success: true, processedRecords: 5 }              │
│   S3: { success: true, processedRecords: 3 }               │
└─────────────────────────────────────────────────────────────┘
```

## Detection Logic

### API Gateway Event
```typescript
{
  httpMethod: "GET",           // ✅ Detected
  requestContext: { ... },     // ✅ Detected
  path: "/users",
  queryStringParameters: {}
}
→ Matches: ApiGatewayFunction.canUse()
```

### SNS Event
```typescript
{
  Records: [{
    EventSource: "aws:sns",    // ✅ Detected
    Sns: {
      Message: "...",
      TopicArn: "..."
    }
  }]
}
→ Matches: SnsFunction.canUse()
```

### S3 Event
```typescript
{
  Records: [{
    eventSource: "aws:s3",     // ✅ Detected
    s3: {
      bucket: { name: "..." },
      object: { key: "..." }
    }
  }]
}
→ Matches: S3Function.canUse()
```

### SQS Event
```typescript
{
  Records: [{
    eventSource: "aws:sqs",    // ✅ Detected
    body: "...",
    messageId: "..."
  }]
}
→ Matches: SqsFunction.canUse()
```

### DynamoDB Stream Event
```typescript
{
  Records: [{
    eventSource: "aws:dynamodb",  // ✅ Detected
    dynamodb: {
      Keys: {},
      NewImage: {},
      OldImage: {}
    }
  }]
}
→ Matches: DynamoDBFunction.canUse()
```

### EventBridge Event
```typescript
{
  source: "custom.app",        // ✅ Detected
  "detail-type": "Order",      // ✅ Detected
  detail: { orderId: "123" }
}
→ Matches: EventBridgeFunction.canUse()
```

## Priority Order

Handlers are checked in registration order. First match wins:

```typescript
export const handler = createFunction(async (container) => {
    container.register(ApiGatewayFunction);   // Checked first
    container.register(SnsFunction);          // Checked second
    container.register(S3Function);           // Checked third
    container.register(RawFunction);          // Fallback (always matches)
});
```

💡 **Tip**: Register `RawFunction` last as it's a catch-all!

## Error Handling

If no handler matches:

```typescript
throw new Error(
    `No registered function implementation can handle this event. ` +
    `Registered 3 implementations. ` +
    `Event type: ["httpMethod", "path", "body", ...]`
);
```

## Cold Start Behavior

**First Request (Cold Start)**:
1. Initialize DI Container
2. Run setup callback
3. Collect registered implementations
4. Detect and execute handler

**Subsequent Requests (Warm)**:
1. Reuse existing container
2. Detect and execute handler (very fast!)

The detection logic is extremely fast (microseconds) as it's just checking event properties!

