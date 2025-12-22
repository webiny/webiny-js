# Quick Reference: Middleware Pattern

## Basic Handler Template

```typescript
import {
    ApiGatewayFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type NextFunction
} from "@cloudi/aws";

class MyHandlerImpl implements ApiGatewayFunction.Interface {
    constructor(private myService: MyService.Interface) {}

    async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
        // 1. Check if you can handle this event
        if (!event.httpMethod) {
            return next(); // Pass to next handler
        }

        // 2. Process the event
        const result = await this.myService.doSomething();

        // 3. Return response
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
        };
    }
}

export const MyHandler = ApiGatewayFunction.createImplementation({
    implementation: MyHandlerImpl,
    dependencies: [MyService]
});
```

## Event Type Checks

### API Gateway
```typescript
if (!event.httpMethod) {
    return next();
}
```

### SNS
```typescript
if (!Array.isArray(event.Records) || event.Records[0]?.EventSource !== "aws:sns") {
    return next();
}
```

### SQS
```typescript
if (!Array.isArray(event.Records) || event.Records[0]?.eventSource !== "aws:sqs") {
    return next();
}
```

### S3
```typescript
if (!Array.isArray(event.Records) || event.Records[0]?.eventSource !== "aws:s3") {
    return next();
}
```

### EventBridge
```typescript
if (!event.source || !event["detail-type"]) {
    return next();
}
```

### DynamoDB Streams
```typescript
if (!Array.isArray(event.Records) || event.Records[0]?.eventSource !== "aws:dynamodb") {
    return next();
}
```

## Multi-Event Handler

```typescript
// handler.ts
import { createFunction } from "@cloudi/aws";
import { MyApiHandler } from "./features/MyApiHandler";
import { MySnsHandler } from "./features/MySnsHandler";
import { MyS3Handler } from "./features/MyS3Handler";

export const handler = createFunction((container) => {
    // Register services
    container.register(Logger).inSingletonScope();
    container.register(UserService).inSingletonScope();

    // Register handlers (order matters!)
    container.register(MyApiHandler).inSingletonScope();
    container.register(MySnsHandler).inSingletonScope();
    container.register(MyS3Handler).inSingletonScope();
});
```

## Available Abstractions

| Abstraction | Event Type | Common Check |
|-------------|------------|--------------|
| `ApiGatewayFunction` | HTTP/REST API | `event.httpMethod` |
| `SnsFunction` | SNS Messages | `Records[0].EventSource === "aws:sns"` |
| `SqsFunction` | SQS Messages | `Records[0].eventSource === "aws:sqs"` |
| `S3Function` | S3 Events | `Records[0].eventSource === "aws:s3"` |
| `EventBridgeFunction` | EventBridge | `event.source && event["detail-type"]` |
| `DynamoDBFunction` | DynamoDB Streams | `Records[0].eventSource === "aws:dynamodb"` |
| `RawFunction` | Custom/Any | Your custom logic |

## Imports

```typescript
// Core
import { createFunction, type NextFunction } from "@cloudi/aws";

// Abstractions
import {
    ApiGatewayFunction,
    SnsFunction,
    SqsFunction,
    S3Function,
    EventBridgeFunction,
    DynamoDBFunction,
    RawFunction
} from "@cloudi/aws";

// Types
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

## Common Patterns

### Route-Specific Handler
```typescript
async execute(event: APIGatewayEvent, next: NextFunction) {
    // Check event type
    if (!event.httpMethod) return next();
    
    // Check specific route
    if (event.path !== "/api/users" || event.httpMethod !== "GET") {
        return next();
    }
    
    // Handle this specific route
    return handleGetUsers();
}
```

### Error Handling
```typescript
async execute(event: APIGatewayEvent, next: NextFunction) {
    if (!event.httpMethod) return next();

    try {
        const result = await this.service.process();
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        this.logger.error("Processing failed", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" })
        };
    }
}
```

### Batch Processing (SNS/SQS/S3)
```typescript
async execute(event: SNSEvent, next: NextFunction): Promise<SnsResult> {
    if (!Array.isArray(event.Records) || event.Records[0]?.EventSource !== "aws:sns") {
        return next();
    }

    let processed = 0;
    for (const record of event.Records) {
        await this.processRecord(record);
        processed++;
    }

    return {
        success: true,
        processedRecords: processed
    };
}
```

## Deployment Example (Pulumi)

```typescript
// Lambda function
const lambda = new aws.lambda.Function("multi-handler", {
    runtime: "nodejs20.x",
    handler: "handler.handler",
    code: new pulumi.asset.FileArchive("./dist")
});

// API Gateway trigger
const api = new aws.apigatewayv2.Api("api");
new aws.apigatewayv2.Integration("integration", {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: lambda.arn
});

// SNS trigger
const topic = new aws.sns.Topic("topic");
new aws.sns.TopicSubscription("subscription", {
    topic: topic.arn,
    protocol: "lambda",
    endpoint: lambda.arn
});

// S3 trigger
const bucket = new aws.s3.Bucket("bucket");
new aws.s3.BucketNotification("notification", {
    bucket: bucket.id,
    lambdaFunctions: [{
        lambdaFunctionArn: lambda.arn,
        events: ["s3:ObjectCreated:*"]
    }]
});
```

## Tips

✅ **DO**
- Check event structure early
- Call `next()` if you can't handle
- Use specific type guards
- Log when passing to next handler

❌ **DON'T**
- Process events you can't handle
- Forget to call `next()`
- Assume event structure
- Throw errors in checks (use `next()` instead)

## Resources

- [MIDDLEWARE_PATTERN.md](./MIDDLEWARE_PATTERN.md) - Full guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Visual diagrams
- [examples/multi-event-handler.example.ts](./src/examples/multi-event-handler.example.ts) - Complete example

