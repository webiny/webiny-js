# Features

This folder is for your Lambda function implementations.

## Example: API Gateway Function

```typescript
// features/ListUsersFunction.ts
import { 
  ApiGatewayFunction,
  type APIGatewayEvent, 
  type APIGatewayProxyResult 
} from "@cloudi/aws";
import type { UserService } from "~/abstractions";
import type { LoggerService } from "~/abstractions";

export class ListUsersFunctionImpl implements ApiGatewayFunction.Interface {
  constructor(
    private userService: UserService.Interface,
    private logger: LoggerService.Interface
  ) {}

  async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    this.logger.info("Listing users");
    
    try {
      const users = await this.userService.listUsers();
      
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users })
      };
    } catch (error) {
      this.logger.error("Failed to list users", error);
      
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error" })
      };
    }
  }
}

// Export using ApiGatewayFunction.createImplementation
export const ListUsersFunction = ApiGatewayFunction.createImplementation({
  implementation: ListUsersFunctionImpl,
  dependencies: [UserService, LoggerService]
});
```

## Example: Registering the Function

```typescript
// handler.ts
import { createFunction } from "@cloudi/aws";
import { ListUsersFunction } from "~/features/ListUsersFunction";
import { ConsoleLogger, DynamoDbUserService } from "~/services";

export const handler = createFunction(async (container) => {
  // Register services
  container.register(ConsoleLogger).inSingletonScope();
  container.register(DynamoDbUserService).inSingletonScope();
  
  // Register the function implementation
  // Auto-detects this handles API Gateway events
  container.register(ListUsersFunction).inSingletonScope();
});
```

## Multi-Event Handler Example

```typescript
// handler.ts - One Lambda handles multiple event types!
import { createFunction } from "@cloudi/aws";
import { ListUsersFunction } from "~/features/ListUsersFunction";
import { ProcessOrderFunction } from "~/features/ProcessOrderFunction";
import { ConsoleLogger, DynamoDbUserService, OrderService } from "~/services";

export const handler = createFunction(async (container) => {
  // Register services
  container.register(ConsoleLogger).inSingletonScope();
  container.register(DynamoDbUserService).inSingletonScope();
  container.register(OrderService).inSingletonScope();
  
  // Register multiple handlers
  // The function auto-detects which one to execute based on the event!
  container.register(ListUsersFunction).inSingletonScope();      // API Gateway
  container.register(ProcessOrderFunction).inSingletonScope();   // SNS
});

// Deploy with multiple triggers - same code handles all events!
```

## Service Example

```typescript
// services/ConsoleLogger.ts
import { LoggerService } from "~/abstractions";

export class ConsoleLoggerImpl implements LoggerService.Interface {
  info(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }
}

export const ConsoleLogger = LoggerService.createImplementation({
  implementation: ConsoleLoggerImpl,
  dependencies: []
});
```

## Available Function Types

- `ApiGatewayFunction` - HTTP API endpoints
- `SnsFunction` - SNS topic handlers
- `S3Function` - S3 event handlers
- `SqsFunction` - SQS queue handlers
- `DynamoDBFunction` - DynamoDB Stream handlers
- `EventBridgeFunction` - EventBridge event handlers
- `RawFunction` - Generic Lambda handlers

## Key Pattern

1. **Implement** the interface with class name suffixed with `Impl`
2. **Export** using `FunctionType.createImplementation()` with capital letter
3. **Register** using `container.register(Implementation).inSingletonScope()`
4. **Auto-detect** - Handler automatically executes the right implementation based on AWS event type

