# AwsLambdaContext and AwsLambdaEvent

Two core abstractions for accessing AWS Lambda runtime context and event data through dependency injection.

## Overview

`AwsLambdaContext` and `AwsLambdaEvent` are automatically registered by `createFunction` for each Lambda invocation, making them available for dependency injection into your services and handlers.

## AwsLambdaContext

The AWS Lambda Context object provides information about the invocation, function, and execution environment.

### Type

```typescript
export const AwsLambdaContext: Abstraction<Context>;
```

Where `Context` is the AWS Lambda Context type from `aws-lambda`.

### Properties Available

- `awsRequestId`: Unique identifier for the request
- `functionName`: Name of the Lambda function
- `functionVersion`: Version of the function
- `invokedFunctionArn`: ARN of the invoked function
- `memoryLimitInMB`: Memory limit configured for the function
- `logGroupName`: CloudWatch log group name
- `logStreamName`: CloudWatch log stream name
- `callbackWaitsForEmptyEventLoop`: Flag for event loop handling
- And more...

### Use Cases

- **Logging**: Inject into loggers for request tracking (e.g., pino-lambda)
- **Metrics**: Track function performance and resource usage
- **Tracing**: Add request IDs to distributed tracing
- **Debugging**: Access runtime information for troubleshooting

### Example

```typescript
import { createImplementation, Abstraction } from "@webiny/di";
import { AwsLambdaContext } from "@cloudi/aws";
import type { Context } from "@webiny/aws-sdk/types";

interface ILogger {
  info(message: string, data?: any): void;
}

const Logger = new Abstraction<ILogger>("Logger");

class ContextAwareLogger implements ILogger {
  constructor(private context: Context) {}

  info(message: string, data?: any): void {
    console.log({
      level: "info",
      message,
      requestId: this.context.awsRequestId,
      functionName: this.context.functionName,
      ...data
    });
  }
}

export const logger = createImplementation({
  abstraction: Logger,
  implementation: ContextAwareLogger,
  dependencies: [AwsLambdaContext]
});
```

## AwsLambdaEvent

The raw AWS Lambda event object before it's qualified and routed to specific handlers.

### Type

```typescript
export const AwsLambdaEvent: Abstraction<any>;
```

### Use Cases

- **Custom Event Processing**: Access the raw event for custom parsing
- **Middleware**: Implement cross-cutting concerns that need raw event access
- **Logging**: Log the full incoming event for debugging
- **Multi-event Handlers**: Handle multiple event types in a single service

### Example

```typescript
import { createImplementation, Abstraction } from "@webiny/di";
import { AwsLambdaEvent, AwsLambdaContext } from "@cloudi/aws";

interface IEventLogger {
  logIncomingEvent(): void;
}

const EventLogger = new Abstraction<IEventLogger>("EventLogger");

class SimpleEventLogger implements IEventLogger {
  constructor(
    private event: any,
    private context: any
  ) {}

  logIncomingEvent(): void {
    console.log({
      requestId: this.context.awsRequestId,
      eventType: this.event.Records ? "Stream" : this.event.httpMethod ? "API Gateway" : "Unknown",
      rawEvent: this.event
    });
  }
}

export const eventLogger = createImplementation({
  abstraction: EventLogger,
  implementation: SimpleEventLogger,
  dependencies: [AwsLambdaEvent, AwsLambdaContext]
});
```

## How It Works

1. AWS Lambda invokes your function with `(event, context)` parameters
2. `createFunction` receives both parameters
3. Both are registered in the DI container using `container.registerInstance()`
4. They're available for injection into any service or handler
5. Fresh instances are registered for each invocation

## Registration

These abstractions are **automatically registered** by `createFunction`. You don't need to manually register them.

```typescript
// In createFunction.ts (internal implementation)
return async (event: any, context: Context): Promise<any> => {
  // ... cold start initialization ...

  // Register the current event and context for this invocation
  container.registerInstance(AwsLambdaEvent, event);
  container.registerInstance(AwsLambdaContext, context);

  // ... event qualification and handler execution ...
};
```

## Best Practices

### Do ✅

- Inject into services that need runtime information (loggers, metrics, tracers)
- Use for request correlation and debugging
- Access in cross-cutting concerns (middleware, decorators)

### Don't ❌

- Don't store references to context/event across invocations
- Don't modify the context or event objects
- Don't use when typed event handlers (ApiGatewayEventHandler, etc.) are more appropriate

## See Also

- [logger-with-context.example.ts](../examples/logger-with-context.example.ts) - Complete example with pino-lambda integration
- [AWS Lambda Context Documentation](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html)
