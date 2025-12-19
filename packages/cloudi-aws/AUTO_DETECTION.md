# Auto-Detection Pattern

## ✅ Major Update: Event Auto-Detection!

The handler now **automatically detects** which function to execute based on the AWS event type, similar to how `@webiny/handler-aws` works!

## The Pattern

### 1. Register Multiple Handlers

```typescript
export const handler = createFunction(async (container) => {
    // Register services
    container.register(ConsoleLogger).inSingletonScope();
    container.register(UserService).inSingletonScope();
    container.register(OrderService).inSingletonScope();
    
    // Register multiple function implementations
    // The handler will auto-detect which one to execute!
    container.register(ListUsersFunction).inSingletonScope();      // API Gateway
    container.register(ProcessOrderFunction).inSingletonScope();   // SNS
    container.register(ResizeImageFunction).inSingletonScope();    // S3
});
```

### 2. One Lambda, Multiple Triggers

Deploy the **same Lambda function** with multiple triggers:
- API Gateway trigger (HTTP requests)
- SNS topic trigger (async messages)
- S3 bucket trigger (file uploads)
- SQS queue trigger (queue messages)
- DynamoDB Stream trigger (database changes)
- EventBridge trigger (custom events)

The handler automatically executes the right implementation based on the incoming event!

## How It Works

### Event Detection Logic

Each function type has a `canUse()` method that inspects the event:

```typescript
// API Gateway
ApiGatewayFunction.canUse(event)
// Checks: event.httpMethod && event.requestContext

// SNS
SnsFunction.canUse(event)
// Checks: event.Records[0].EventSource === "aws:sns"

// S3
S3Function.canUse(event)
// Checks: event.Records[0].eventSource === "aws:s3"

// SQS
SqsFunction.canUse(event)
// Checks: event.Records[0].eventSource === "aws:sqs"

// DynamoDB Streams
DynamoDBFunction.canUse(event)
// Checks: event.Records[0].eventSource === "aws:dynamodb"

// EventBridge
EventBridgeFunction.canUse(event)
// Checks: event.source && event["detail-type"]

// Raw (fallback)
RawFunction.canUse(event)
// Always returns true (catch-all)
```

### Execution Flow

```
1. Event arrives at Lambda
2. Handler inspects registered implementations
3. Finds matching implementation using canUse()
4. Resolves implementation from DI container
5. Executes the matched function
```

## Complete Example

### Features

```typescript
// features/ListUsersFunction.ts
export class ListUsersFunctionImpl implements ApiGatewayFunction.Interface {
    constructor(private userService: UserService.Interface) {}
    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        const users = await this.userService.listUsers();
        return { statusCode: 200, body: JSON.stringify({ users }) };
    }
}

export const ListUsersFunction = ApiGatewayFunction.createImplementation({
    implementation: ListUsersFunctionImpl,
    dependencies: [UserService]
});
```

```typescript
// features/ProcessOrderFunction.ts
export class ProcessOrderFunctionImpl implements SnsFunction.Interface {
    constructor(private orderService: OrderService.Interface) {}
    async execute(event: SNSEvent): Promise<SnsResult> {
        for (const record of event.Records) {
            const order = JSON.parse(record.Sns.Message);
            await this.orderService.process(order);
        }
        return { success: true };
    }
}

export const ProcessOrderFunction = SnsFunction.createImplementation({
    implementation: ProcessOrderFunctionImpl,
    dependencies: [OrderService]
});
```

```typescript
// features/ResizeImageFunction.ts
export class ResizeImageFunctionImpl implements S3Function.Interface {
    constructor(private imageService: ImageService.Interface) {}
    async execute(event: S3Event): Promise<S3Result> {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = record.s3.object.key;
            await this.imageService.resize(bucket, key);
        }
        return { success: true };
    }
}

export const ResizeImageFunction = S3Function.createImplementation({
    implementation: ResizeImageFunctionImpl,
    dependencies: [ImageService]
});
```

### Handler (One Lambda for All!)

```typescript
// handler.ts
import { createFunction } from "@cloudi/aws";
import { ListUsersFunction } from "~/features/ListUsersFunction";
import { ProcessOrderFunction } from "~/features/ProcessOrderFunction";
import { ResizeImageFunction } from "~/features/ResizeImageFunction";
import { ConsoleLogger, UserService, OrderService, ImageService } from "~/services";

export const handler = createFunction(async (container) => {
    // Register services (shared across all functions)
    container.register(ConsoleLogger).inSingletonScope();
    container.register(UserService).inSingletonScope();
    container.register(OrderService).inSingletonScope();
    container.register(ImageService).inSingletonScope();
    
    // Register all function implementations
    container.register(ListUsersFunction).inSingletonScope();
    container.register(ProcessOrderFunction).inSingletonScope();
    container.register(ResizeImageFunction).inSingletonScope();
});
```

### Infrastructure

```typescript
// Deploy with Pulumi/CDK/Terraform
const lambda = new aws.lambda.Function("multi-handler", {
    code: "./dist",
    handler: "handler.handler",
    runtime: "nodejs20.x"
});

// Trigger 1: API Gateway
const api = new aws.apigateway.RestApi("api");
const integration = new aws.apigateway.Integration({
    type: "AWS_PROXY",
    integrationHttpMethod: "POST",
    uri: lambda.invokeArn
});

// Trigger 2: SNS Topic
const topic = new aws.sns.Topic("orders");
new aws.sns.TopicSubscription("order-subscription", {
    topic: topic.arn,
    protocol: "lambda",
    endpoint: lambda.arn
});

// Trigger 3: S3 Bucket
const bucket = new aws.s3.Bucket("images");
new aws.s3.BucketNotification("image-notification", {
    bucket: bucket.id,
    lambdaFunctions: [{
        lambdaFunctionArn: lambda.arn,
        events: ["s3:ObjectCreated:*"]
    }]
});

// Same Lambda handles all three triggers!
```

## Benefits

✅ **Deploy Once**: One Lambda function handles multiple event types  
✅ **Shared Services**: DI container services shared across all functions  
✅ **Auto-Detection**: No manual routing, automatic based on event inspection  
✅ **Type Safe**: Full TypeScript inference for each handler  
✅ **Testable**: Each handler can be tested independently  
✅ **Familiar Pattern**: Similar to `@webiny/handler-aws` pattern  

## Comparison with handler-aws

### handler-aws Pattern
```typescript
const handler = createSourceHandler({
    name: "handler-aws-api-gateway",
    canUse: event => !!event.httpMethod,
    handle: async ({ event }) => { /* ... */ }
});
```

### cloudi-aws Pattern
```typescript
export const ListUsersFunction = ApiGatewayFunction.createImplementation({
    implementation: ListUsersFunctionImpl,  // DI-enabled class
    dependencies: [UserService, LoggerService]
    // canUse is automatically added from ApiGatewayFunction.canUse
});
```

Same concept, but with:
- Built-in DI support
- Type-safe implementation classes
- Automatic dependency injection
- Cleaner abstraction pattern

## Future: Route-Level Handlers

Later, we'll expand API Gateway to support route-level handlers:

```typescript
// Coming soon!
container.register(ListUsersFunction).forRoute("GET", "/users");
container.register(CreateUserFunction).forRoute("POST", "/users");
container.register(GetUserFunction).forRoute("GET", "/users/:id");
```

But for now, each handler handles all requests for its event type!

