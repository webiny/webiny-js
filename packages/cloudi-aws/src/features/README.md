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

export class ListUsersFunction implements ApiGatewayFunction.Interface {
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
```

## Example: Registering the Function

```typescript
// handler.ts
import { createFunction, ApiGatewayFunction } from "@cloudi/aws";
import { LoggerService, UserService } from "~/abstractions";
import { ConsoleLogger } from "~/services/ConsoleLogger";
import { DynamoDBUserService } from "~/services/DynamoDBUserService";
import { ListUsersFunction } from "~/features/ListUsersFunction";

export const handler = createFunction(
  ApiGatewayFunction,
  async (container) => {
    // Register services
    container.bind(LoggerService).to(ConsoleLogger);
    container.bind(UserService).to(DynamoDBUserService);
    
    // Register the function implementation
    container.bind(ApiGatewayFunction).to(ListUsersFunction);
  }
);
```

## Available Function Types

- `ApiGatewayFunction` - HTTP API endpoints
- `SnsFunction` - SNS topic handlers
- `S3Function` - S3 event handlers
- `SqsFunction` - SQS queue handlers
- `DynamoDBFunction` - DynamoDB Stream handlers
- `EventBridgeFunction` - EventBridge event handlers
- `RawFunction` - Generic Lambda handlers

