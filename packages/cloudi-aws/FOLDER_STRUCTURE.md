# Folder Structure Reorganization

The event handlers and qualifiers have been reorganized into dedicated folders for better code organization.

## New Structure

```
src/
├── abstractions/
│   ├── createAbstraction.ts      # Helper for creating abstractions
│   ├── AwsLambdaContext.ts       # AWS Lambda Context abstraction
│   ├── AwsLambdaEvent.ts         # AWS Lambda Event abstraction
│   └── index.ts                  # Re-exports from handlers/ and qualifiers/
│
├── handlers/
│   ├── ApiGatewayEventHandler.ts
│   ├── DynamoDBEventHandler.ts
│   ├── EventBridgeEventHandler.ts
│   ├── RawEventHandler.ts
│   ├── S3EventHandler.ts
│   ├── SnsEventHandler.ts
│   ├── SqsEventHandler.ts
│   └── index.ts
│
├── qualifiers/
│   ├── ApiGatewayEventQualifier.ts
│   ├── ApiGatewayEventQualifier.impl.ts
│   ├── DynamoDBEventQualifier.ts
│   ├── DynamoDBEventQualifier.impl.ts
│   ├── EventBridgeEventQualifier.ts
│   ├── EventBridgeEventQualifier.impl.ts
│   ├── S3EventQualifier.ts
│   ├── S3EventQualifier.impl.ts
│   ├── SnsEventQualifier.ts
│   ├── SnsEventQualifier.impl.ts
│   ├── SqsEventQualifier.ts
│   ├── SqsEventQualifier.impl.ts
│   └── index.ts
│
├── features/
│   ├── ListUsersFunction.example.ts
│   ├── ProcessOrderFunction.example.ts
│   ├── README.md
│   └── index.ts                  # Re-exports from qualifiers/
│
├── examples/
│   ├── logger-with-context.example.ts
│   └── multi-event-handler.example.ts
│
├── createFunction.ts
├── index.ts
└── types.ts
```

## What Changed

### 1. **handlers/** folder

- Contains all event handler **abstractions**
- Each handler file defines:
  - Interface (e.g., `IApiGatewayEventHandler`)
  - Abstraction (e.g., `ApiGatewayEventHandler`)
  - Namespace with type aliases

### 2. **qualifiers/** folder

- Contains both **abstractions** and **implementations** for event qualifiers
- Abstraction files (e.g., `ApiGatewayEventQualifier.ts`):
  - Define the interface
  - Create the abstraction
- Implementation files (e.g., `ApiGatewayEventQualifier.impl.ts`):
  - Implement the qualifier logic
  - Export the implementation using `createImplementation`

### 3. **abstractions/** folder

- Now only contains:
  - `createAbstraction.ts` - Helper function
  - `AwsLambdaContext.ts` - Core abstraction
  - `AwsLambdaEvent.ts` - Core abstraction
  - `index.ts` - Re-exports from handlers/ and qualifiers/

### 4. **features/** folder

- Now only contains:
  - Example files (ListUsersFunction, ProcessOrderFunction)
  - README
  - index.ts that re-exports qualifier implementations

## Import Paths

### For users of the package

Nothing changes! All imports still work:

```typescript
import {
  ApiGatewayEventHandler,
  SnsEventHandler,
  ApiGatewayEventQualifier,
  AwsLambdaContext
} from "@cloudi/aws";
```

### Internally

- Handlers import `createAbstraction` from `../abstractions/createAbstraction.js`
- Qualifiers import `createAbstraction` from `../abstractions/createAbstraction.js`
- Qualifier implementations import their abstraction from `./[Name]EventQualifier.js`

## Benefits

1. **Better Organization**: Related files are grouped together
2. **Clearer Separation**: Handlers and qualifiers are in separate folders
3. **Easier Navigation**: Finding event handlers or qualifiers is intuitive
4. **Scalability**: Easy to add new handlers or qualifiers
5. **Backward Compatible**: All existing imports continue to work

## Migration Notes

If you were directly importing from internal paths (not recommended), update:

### Old

```typescript
import { ApiGatewayEventHandler } from "@cloudi/aws/abstractions/ApiGatewayEventHandler";
import { apiGatewayEventQualifier } from "@cloudi/aws/features/ApiGatewayEventQualifier";
```

### New

```typescript
import { ApiGatewayEventHandler } from "@cloudi/aws/handlers/ApiGatewayEventHandler";
import { apiGatewayEventQualifier } from "@cloudi/aws/qualifiers/ApiGatewayEventQualifier.impl";
```

### Recommended (unchanged)

```typescript
import { ApiGatewayEventHandler, apiGatewayEventQualifier } from "@cloudi/aws";
```
