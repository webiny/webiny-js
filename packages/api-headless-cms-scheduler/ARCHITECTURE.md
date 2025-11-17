# API Headless CMS Scheduler - Architecture Documentation

## Overview

The `@webiny/api-headless-cms-scheduler` package provides scheduling capabilities for Webiny Headless CMS, allowing users to schedule publish and unpublish operations for CMS entries at specific future dates. The package integrates with AWS EventBridge Scheduler to execute scheduled actions via Lambda invocations.

## Key Entry Points

### Main Export (`src/index.ts`)

**`createHeadlessCmsScheduler(params)`** - Primary entry point that registers all necessary plugins:
- Handler plugin for processing scheduled CMS action events
- API plugins for GraphQL operations and context management
- Model definition for storing schedule records

```typescript
createHeadlessCmsScheduler({
  getClient: (config) => schedulerClient
})
```

## Core Architecture Components

### 1. Context Layer (`src/context.ts`)

**Purpose**: Initializes and attaches the scheduler to the CMS context.

**Key Responsibilities**:
- Validates Headless CMS is ready
- Loads manifest from DynamoDB to get Lambda ARN and IAM role
- Creates `SchedulerService` with AWS credentials
- Attaches `scheduler` callable to `context.cms`
- Registers lifecycle hooks

**Flow**: `context.ts:22-77`
1. Check if CMS is installed and ready
2. Load scheduler manifest (Lambda ARN, Role ARN) from DynamoDB
3. Get scheduler model (`webinyCmsSchedule`)
4. Attach lifecycle hooks
5. Create and attach scheduler factory to context

### 2. Scheduler Layer (`src/scheduler/`)

#### Scheduler Factory (`createScheduler.ts`)

**Purpose**: Factory function that creates model-specific scheduler instances.

**Signature**: `(targetModel: CmsModel) => IScheduler`

**Key Components Created**:
- `ScheduleFetcher` - Retrieves schedule records
- `PublishScheduleAction` - Handles publish scheduling
- `UnpublishScheduleAction` - Handles unpublish scheduling
- `ScheduleExecutor` - Coordinates action execution
- `Scheduler` - Main scheduler interface

#### Scheduler Class (`Scheduler.ts`)

**Purpose**: Main scheduler interface implementation using composition pattern.

**Methods**:
- `schedule(targetId, input)` - Create/update a schedule
- `cancel(id)` - Cancel existing schedule
- `getScheduled(targetId)` - Get schedule for entry
- `listScheduled(params)` - List schedules with filtering

#### ScheduleExecutor (`ScheduleExecutor.ts`)

**Purpose**: Executes scheduling operations by delegating to appropriate action classes.

**Key Methods**:
- `schedule(targetId, input)`: Creates new schedule or reschedules existing
  - Generates schedule record ID from target ID
  - Checks for existing schedule
  - Delegates to appropriate action (Publish/Unpublish)
- `cancel(id)`: Cancels schedule by ID
- `getAction(type)`: Returns appropriate action handler

#### ScheduleFetcher (`ScheduleFetcher.ts`)

**Purpose**: Retrieves schedule records from CMS.

**Key Methods**:
- `getScheduled(targetId)`: Fetches single schedule record
- `listScheduled(params)`: Lists schedules with filtering/pagination

**Note**: Always filters by target model ID to ensure model isolation.

#### Schedule Actions

##### PublishScheduleAction (`actions/PublishScheduleAction.ts`)

**Purpose**: Handles publish scheduling logic.

**Key Methods**:

1. **`schedule(params)`** - Three execution paths:
   - **Immediate publish**: Publishes entry immediately, no schedule created
   - **Past date**: Updates entry metadata with custom dates, then publishes
   - **Future date**: Creates schedule entry in CMS + AWS EventBridge schedule

2. **`reschedule(original, input)`** - Updates existing schedule:
   - If immediate or past date: publishes and cancels schedule
   - Otherwise: updates schedule entry and EventBridge schedule

3. **`cancel(id)`** - Deletes schedule entry and EventBridge schedule

**Error Handling**: If EventBridge schedule creation fails, deletes the CMS schedule entry (rollback).

##### UnpublishScheduleAction (`actions/UnpublishScheduleAction.ts`)

**Purpose**: Similar to PublishScheduleAction but for unpublish operations.

### 3. Service Layer (`src/service/`)

#### SchedulerService (`SchedulerService.ts`)

**Purpose**: Wrapper around AWS EventBridge Scheduler SDK.

**Key Methods**:
- `create(params)`: Creates EventBridge schedule
  - Validates date is in future
  - Auto-updates if schedule exists
  - Creates one-time schedule with Lambda target
- `update(params)`: Updates existing schedule
- `delete(id)`: Deletes schedule from EventBridge
- `exists(id)`: Checks if schedule exists

**Schedule Configuration**:
- Expression: `at(YYYY-MM-DDTHH:mm:ss)` format
- Action after completion: DELETE (auto-cleanup)
- Flexible time window: OFF (exact time execution)
- Target: Lambda function with schedule event payload

**Payload Format**:
```json
{
  "WebinyScheduledCmsAction": {
    "id": "schedule-record-id",
    "scheduleOn": "2024-01-01T12:00:00.000Z"
  }
}
```

### 4. Handler Layer (`src/handler/`)

#### Handler (`Handler.ts`)

**Purpose**: Processes events from AWS EventBridge Scheduler when schedules execute.

**Execution Flow**: `Handler.ts:33-105`

1. Extract schedule ID from event payload
2. Fetch schedule entry from CMS (without authorization)
3. Set identity to the user who scheduled the action
4. Get target model and schedule record
5. Find appropriate handler action (Publish/Unpublish)
6. Execute the action
7. Delete schedule entry on success
8. Update schedule entry with error on failure

#### Handler Actions

##### PublishHandlerAction (`actions/PublishHandlerAction.ts`)

**Purpose**: Executes scheduled publish operations.

**Logic**: `PublishHandlerAction.ts:30-74`
1. Fetch target entry
2. Check if already published:
   - **Not published**: Publish entry
   - **Same revision published**: Republish (idempotent)
   - **Different revision published**: Unpublish old, publish new

##### UnpublishHandlerAction (`actions/UnpublishHandlerAction.ts`)

**Purpose**: Executes scheduled unpublish operations.

**Logic**: `UnpublishHandlerAction.ts:25-58`
1. Fetch target entry
2. Check publish status:
   - **Not published**: Do nothing (log warning)
   - **Exact match published**: Unpublish
   - **Different revision published**: Unpublish published revision

#### Event Handler Registration (`handler/index.ts`)

Registers handler with AWS event system using `createEventHandler`:
- Event identification: Checks for `WebinyScheduledCmsAction` property
- Handler factory: Creates Handler with Publish/Unpublish actions
- Integration: Registered in handler-aws registry

### 5. GraphQL Layer (`src/graphql/`)

#### Schema Definition (`graphql/index.ts`)

**Queries**:
- `getCmsSchedule(modelId, id)`: Get single schedule
- `listCmsSchedules(modelId, where, sort, limit, after)`: List schedules

**Mutations**:
- `createCmsSchedule(modelId, id, input)`: Create schedule
- `updateCmsSchedule(modelId, id, input)`: Update schedule
- `cancelCmsSchedule(modelId, id)`: Cancel schedule

**Input Validation**: Uses Zod schemas (`graphql/schema.ts`) for runtime validation

### 6. Data Model Layer (`src/scheduler/model.ts`)

**Model ID**: `webinyCmsSchedule`

**Fields**:
- `targetId`: ID of the entry to schedule (with version)
- `targetModelId`: Model ID of target entry
- `scheduledBy`: Identity object (id, displayName, type)
- `scheduledOn`: DateTime when action should execute
- `dateOn`: DateTime for custom date metadata (currently unused)
- `type`: "publish" or "unpublish"
- `title`: Title of target entry
- `error`: Error message if execution failed

**Type**: Private model (not exposed to public GraphQL API)

### 7. Lifecycle Hooks (`src/hooks/index.ts`)

**Purpose**: Auto-cleanup when entries are manually published/unpublished/deleted.

**Hooks Registered**:
- `onEntryAfterPublish`: Cancel publish schedule
- `onEntryAfterUnpublish`: Cancel unpublish schedule
- `onEntryAfterDelete`: Cancel any schedule

**Reasoning**: If user performs action manually, scheduled action becomes obsolete.

### 8. Manifest System (`src/manifest.ts`)

**Purpose**: Loads scheduler configuration from DynamoDB Service Discovery.

**Schema**:
```typescript
{
  scheduler: {
    lambdaArn: string,  // ARN of handler Lambda
    roleArn: string     // IAM role for EventBridge
  }
}
```

**Error Handling**: Returns error object if manifest missing or invalid.

## Data Flow Diagrams

### Creating a Schedule

```
GraphQL Mutation (createCmsSchedule)
  ↓
Validation (Zod schema)
  ↓
Get target model
  ↓
Get scheduler for model (context.cms.scheduler(model))
  ↓
scheduler.schedule(targetId, input)
  ↓
ScheduleExecutor.schedule()
  ↓
ScheduleAction.schedule() (Publish/Unpublish)
  ↓
├─ Immediate? → Publish/Unpublish entry directly
├─ Past date? → Update metadata + Publish/Unpublish
└─ Future date?
    ↓
    Create CMS entry (webinyCmsSchedule)
    ↓
    SchedulerService.create()
    ↓
    AWS EventBridge Scheduler (creates schedule)
```

### Executing a Schedule

```
AWS EventBridge Scheduler (triggers at scheduled time)
  ↓
Lambda invocation with payload
  ↓
Handler.handle()
  ↓
Fetch schedule entry (bypass authorization)
  ↓
Set identity to scheduler
  ↓
Get target model & entry
  ↓
Find handler action (Publish/Unpublish)
  ↓
HandlerAction.handle()
  ↓
├─ PublishHandlerAction: Check if published → Publish/Republish
└─ UnpublishHandlerAction: Check if published → Unpublish
  ↓
Delete schedule entry (cleanup)
```

### Canceling a Schedule

```
GraphQL Mutation (cancelCmsSchedule)
  ↓
scheduler.cancel(id)
  ↓
ScheduleExecutor.cancel()
  ↓
Fetch existing schedule
  ↓
ScheduleAction.cancel()
  ↓
Delete CMS entry (webinyCmsSchedule)
  ↓
SchedulerService.delete()
  ↓
AWS EventBridge Scheduler (delete schedule)
```

## Important Constants (`src/constants.ts`)

- `SCHEDULE_MODEL_ID`: "webinyCmsSchedule" - CMS model for schedules
- `SCHEDULE_ID_PREFIX`: "wby-schedule-" - Prefix for schedule IDs
- `SCHEDULE_MIN_FUTURE_SECONDS`: 65 - Minimum seconds in future for scheduling
- `SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER`: "WebinyScheduledCmsAction" - Event type identifier

## Key Design Patterns

### 1. Factory Pattern
- `createScheduler()` creates model-specific scheduler instances
- Each model gets isolated scheduler with its own actions

### 2. Strategy Pattern
- `IScheduleAction` interface with Publish/Unpublish implementations
- `IHandlerAction` interface with Publish/Unpublish handlers
- Actions selected based on schedule type

### 3. Composition Pattern
- `Scheduler` composes `ScheduleFetcher` and `ScheduleExecutor`
- `ScheduleExecutor` composes multiple `ScheduleAction` instances

### 4. Repository Pattern
- `ScheduleFetcher` abstracts data retrieval
- `SchedulerService` abstracts AWS EventBridge operations

## Security Considerations

1. **Authorization Bypass**: Handler runs `withoutAuthorization()` to fetch schedule entries
2. **Identity Impersonation**: Handler sets identity to original scheduler for proper permissions
3. **Model Isolation**: Schedulers only operate on their assigned model
4. **Private Model**: Schedule model not exposed to public API

## Error Handling Strategy

1. **Schedule Creation Failure**: Rollback CMS entry if EventBridge fails
2. **Execution Failure**: Update schedule entry with error message
3. **Missing Schedules**: Return null for not-found schedules
4. **Manifest Errors**: Log and skip scheduler attachment entirely

## Dependencies

### Runtime
- `@webiny/api-headless-cms`: CMS core functionality
- `@webiny/aws-sdk`: AWS EventBridge Scheduler client
- `@webiny/handler-graphql`: GraphQL resolvers
- `zod`: Schema validation

### Infrastructure
- AWS EventBridge Scheduler
- AWS Lambda (for handler)
- IAM Role (for EventBridge to invoke Lambda)
- DynamoDB (for manifest storage)

## Extension Points

### Adding New Schedule Types

1. Create new `ScheduleAction` implementing `IScheduleAction`
2. Create new `HandlerAction` implementing `IHandlerAction`
3. Add to actions array in `createScheduler()` and `createScheduledCmsActionEventHandler()`
4. Update `ScheduleType` enum in `types.ts`
5. Update GraphQL schema

### Custom Schedule Validation

Override or extend Zod schemas in `graphql/schema.ts`

### Additional Lifecycle Hooks

Add hooks in `hooks/index.ts` using CMS lifecycle events

## Testing Strategy

Tests are organized by layer:
- `/scheduler/` - Scheduler, Executor, Fetcher, Actions
- `/handler/` - Handler and Handler Actions
- `/service/` - SchedulerService (uses aws-sdk-client-mock)
- `/graphql/` - GraphQL schema validation

## File Structure Summary

```
src/
├── index.ts                    # Main entry point
├── context.ts                  # Context plugin setup
├── types.ts                    # Type definitions for context
├── constants.ts                # Global constants
├── manifest.ts                 # Manifest loader
├── graphql/
│   ├── index.ts               # GraphQL plugin
│   └── schema.ts              # Zod validation schemas
├── scheduler/
│   ├── createScheduler.ts     # Scheduler factory
│   ├── Scheduler.ts           # Main scheduler class
│   ├── ScheduleExecutor.ts    # Execution coordinator
│   ├── ScheduleFetcher.ts     # Data retrieval
│   ├── ScheduleRecord.ts      # Record transformations
│   ├── model.ts               # CMS model definition
│   ├── types.ts               # Scheduler types
│   ├── dates.ts               # Date utilities
│   ├── createScheduleRecordId.ts  # ID generation
│   └── actions/
│       ├── PublishScheduleAction.ts
│       └── UnpublishScheduleAction.ts
├── handler/
│   ├── index.ts               # Event handler registration
│   ├── Handler.ts             # Main handler class
│   ├── types.ts               # Handler types
│   └── actions/
│       ├── PublishHandlerAction.ts
│       └── UnpublishHandlerAction.ts
├── service/
│   ├── SchedulerService.ts    # AWS EventBridge wrapper
│   └── types.ts               # Service types
├── hooks/
│   └── index.ts               # Lifecycle hooks
└── utils/
    └── dateInTheFuture.ts     # Date validation
```

## Common Use Cases

### 1. Schedule Entry Publication
User wants to publish a blog post at a future date:
- User creates draft entry
- Calls `createCmsSchedule` with future date and type="publish"
- System creates schedule in CMS and EventBridge
- At scheduled time, entry is published automatically

### 2. Scheduled Unpublish
User wants to unpublish content after campaign ends:
- User has published entry
- Calls `createCmsSchedule` with future date and type="unpublish"
- At scheduled time, entry is unpublished

### 3. Reschedule Operation
User wants to change publication date:
- Calls `updateCmsSchedule` with new date
- System updates both CMS entry and EventBridge schedule

### 4. Manual Override
User manually publishes scheduled entry:
- `onEntryAfterPublish` hook triggers
- System cancels schedule automatically
- EventBridge schedule is deleted

## Performance Considerations

1. **Pagination**: List operations support cursor-based pagination
2. **Model Filtering**: Queries filtered by model ID at database level
3. **Lazy Loading**: Scheduler created per-model on-demand
4. **Auto-cleanup**: EventBridge schedules auto-delete after execution

## Troubleshooting

### Schedule Not Executing
1. Check schedule entry exists in CMS (`webinyCmsSchedule`)
2. Verify EventBridge schedule exists (use AWS console or `SchedulerService.exists()`)
3. Check Lambda execution logs for handler errors
4. Verify IAM role has Lambda invoke permissions

### Schedule Entry Has Error Field
Check `error` field in schedule entry for execution failure details

### Scheduler Not Available
1. Check manifest loaded successfully (logs on startup)
2. Verify `webinyCmsSchedule` model exists
3. Ensure CMS is fully installed

### Date Validation Errors
Verify date is at least 65 seconds in future (`SCHEDULE_MIN_FUTURE_SECONDS`)