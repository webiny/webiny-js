# Folder Structure Reorganization

The event handlers and qualifiers have been reorganized into a nested structure under `abstractions/` and `features/`.

## New Structure

```
src/
├── abstractions/
│   ├── createAbstraction.ts      # Helper for creating abstractions
│   ├── AwsLambdaContext.ts       # AWS Lambda Context abstraction
│   ├── AwsLambdaEvent.ts         # AWS Lambda Event abstraction
│   ├── index.ts                  # Re-exports from handlers/ and qualifiers/
│   │
│   ├── handlers/
│   │   ├── ApiGatewayEventHandler.ts
│   │   ├── DynamoDBEventHandler.ts
│   │   ├── EventBridgeEventHandler.ts
│   │   ├── RawEventHandler.ts
│   │   ├── S3EventHandler.ts
│   │   ├── SnsEventHandler.ts
│   │   ├── SqsEventHandler.ts
│   │   └── index.ts
│   │
│   └── qualifiers/
│       ├── ApiGatewayEventQualifier.ts
│       ├── DynamoDBEventQualifier.ts
│       ├── EventBridgeEventQualifier.ts
│       ├── S3EventQualifier.ts
│       ├── SnsEventQualifier.ts
│       ├── SqsEventQualifier.ts
│       └── index.ts
│
├── features/
│   ├── ListUsersFunction.example.ts
│   ├── ProcessOrderFunction.example.ts
│   ├── README.md
│   ├── index.ts                  # Re-exports from qualifiers/
│   │
│   └── qualifiers/
│       ├── ApiGatewayEventQualifier.ts
│       ├── DynamoDBEventQualifier.ts
│       ├── EventBridgeEventQualifier.ts
│       ├── S3EventQualifier.ts
│       ├── SnsEventQualifier.ts
│       ├── SqsEventQualifier.ts
│       └── index.ts
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

### 1. **abstractions/handlers/** folder

- Contains all event handler **abstractions**
- Each handler file defines:
  - Interface (e.g., `IApiGatewayEventHandler`)
  - Abstraction (e.g., `ApiGatewayEventHandler`)
  - Namespace with type aliases
- Imports `createAbstraction` from `../createAbstraction.js`

### 2. **abstractions/qualifiers/** folder

- Contains event qualifier **abstractions only**
- Abstraction files (e.g., `ApiGatewayEventQualifier.ts`):
  - Define the interface
  - Create the abstraction
- Imports `createAbstraction` from `../createAbstraction.js`

### 3. **features/qualifiers/** folder

- Contains event qualifier **implementations only**
- Implementation files (e.g., `ApiGatewayEventQualifier.ts`):
  - Implement the qualifier logic
  - Export the implementation using `createImplementation`
- Imports abstractions from `../../abstractions/qualifiers/[Name].js`
- **Note**: Same filename as abstractions, but in different folder (`features/qualifiers/` vs `abstractions/qualifiers/`)

### 4. **abstractions/** folder root

- Contains:
  - `createAbstraction.ts` - Helper function
  - `AwsLambdaContext.ts` - Core abstraction
  - `AwsLambdaEvent.ts` - Core abstraction
  - `index.ts` - Re-exports from handlers/ and qualifiers/
  - `handlers/` - Handler abstractions
  - `qualifiers/` - Qualifier abstractions

### 5. **features/** folder

- Contains:
  - Example files (ListUsersFunction, ProcessOrderFunction)
  - README
  - index.ts that re-exports from qualifiers/
  - `qualifiers/` - Qualifier implementations

## Import Paths

### For users of the package

Nothing changes! All imports still work:

```typescript
import {
  ApiGatewayEventHandler,
  SnsEventHandler,
  ApiGatewayEventQualifier,
  AwsLambdaContext,
  apiGatewayEventQualifier
} from "@cloudi/aws";
```

### Internally

**Handler abstractions:**

```typescript
import { createAbstraction } from "../createAbstraction.js";
```

**Qualifier abstractions:**

```typescript
import { createAbstraction } from "../createAbstraction.js";
```

**Qualifier implementations:**

```typescript
import { ApiGatewayEventQualifier } from "../../abstractions/qualifiers/ApiGatewayEventQualifier.js";
```

**Main index files:**

- `abstractions/index.ts` exports from `./handlers/index.js` and `./qualifiers/index.js`
- `features/index.ts` exports from `./qualifiers/index.js`

## Benefits

1. **Logical Grouping**: Abstractions are under `abstractions/`, implementations under `features/`
2. **Clear Separation**: Handlers and qualifiers have their own subfolders
3. **Easier Navigation**: Related files are nested together
4. **Scalability**: Easy to add new handlers or qualifiers
5. **Backward Compatible**: All existing imports continue to work

## File Naming Convention

- **Handler Abstractions**: `[EventType]EventHandler.ts` (in `abstractions/handlers/`)
- **Qualifier Abstractions**: `[EventType]EventQualifier.ts` (in `abstractions/qualifiers/`)
- **Qualifier Implementations**: `[EventType]EventQualifier.ts` (in `features/qualifiers/`)
- **Note**: Qualifier abstractions and implementations share the same filename but live in different directories
- All handler implementations are created by users

## Migration Notes

If you were directly importing from internal paths (not recommended), update:

### Old

```typescript
import { ApiGatewayEventHandler } from "@cloudi/aws/abstractions/ApiGatewayEventHandler";
import { apiGatewayEventQualifier } from "@cloudi/aws/features/ApiGatewayEventQualifier";
```

### New

```typescript
import { ApiGatewayEventHandler } from "@cloudi/aws/abstractions/handlers/ApiGatewayEventHandler";
import { apiGatewayEventQualifier } from "@cloudi/aws/features/qualifiers/ApiGatewayEventQualifier";
```

### Recommended (unchanged)

```typescript
import { ApiGatewayEventHandler, apiGatewayEventQualifier } from "@cloudi/aws";
```
