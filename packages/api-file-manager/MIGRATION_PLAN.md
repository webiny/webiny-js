# Migration Plan: api-file-manager → Feature-Based Architecture

## Overview

Migrate `packages/api-file-manager` from the current CRUD factory pattern to Clean Architecture with feature-based organization, following the pattern established in `packages/api-record-locking`.

**Reference Implementation:** `packages/api-record-locking/src/features/`

---

## Current Architecture Issues

1. **CRUD Factory Pattern**: Uses `createFileManager()` factory that returns methods directly
2. **No Abstractions**: Operations not exposed through DI abstractions
3. **PubSub Topics**: Uses `@webiny/pubsub` topics instead of EventPublisher pattern
4. **Direct CMS Access**: Uses `CmsFilesStorage` which directly wraps `context.cms` instead of injecting CMS use cases
5. **Mixed Concerns**: Business logic, persistence, and event handling mixed together in `CmsFilesStorage`
6. **No Domain Layer**: File entity is just an interface, no domain behavior
7. **God Object Storage**: `CmsFilesStorage` handles all operations instead of feature-specific repositories

---

## Target Architecture

```
packages/api-file-manager/src/
├── domain/
│   ├── file/
│   │   ├── abstractions.ts      # FileModel abstraction
│   │   ├── errors.ts            # File domain errors
│   │   ├── types.ts             # File domain types
│   │   └── File.ts              # File domain model (if needed)
│   └── settings/
│       ├── abstractions.ts      # Settings abstractions
│       ├── errors.ts            # Settings domain errors
│       └── types.ts             # Settings domain types
├── features/
│   ├── file/
│   │   ├── GetFile/
│   │   ├── ListFiles/
│   │   ├── ListTags/
│   │   ├── CreateFile/
│   │   ├── CreateFilesInBatch/
│   │   ├── UpdateFile/
│   │   └── DeleteFile/
│   └── settings/
│       ├── GetSettings/
│       └── UpdateSettings/
└── graphql/
    └── schema.ts                # Updated to use use cases via DI
```

---

## Domain Layer

### File Domain (`domain/file/`)

#### Model Definition (`domain/file/fileModel.ts`)

The CMS model definition for the `fmFile` model, moved from `src/cmsFileStorage/file.model.ts`.

```typescript
export const FILE_MODEL_ID = "fmFile";
export const createFileModel = (params: { withPrivateFiles: boolean }) => { ... }
```

This model defines the schema for file storage in CMS with fields: location, name, key, type, size, meta, tags, aliases, and optionally accessControl.

#### Errors (`domain/file/errors.ts`)

```typescript
FileNotFoundError              // File not found by ID
FileListError                  // Error listing files
FileCreateError                // Error creating file
FileUpdateError                // Error updating file
FileDeleteError                // Error deleting file
FileAlreadyExistsError         // File with key already exists
InvalidFileSizeError           // File size outside allowed range
InvalidFileTypeError           // File type not allowed
```

#### Abstractions (`domain/file/abstractions.ts`)

```typescript
FileModel                      // The fmFile CMS model abstraction (registered via container.registerInstance)
```

This abstraction will be registered in the composite feature like:
```typescript
container.registerInstance(FileModel, params.model);
```

#### Types (`domain/file/types.ts`)

```typescript
File                           // File entity
FileInput                      // File input for creation
FileAlias                      // File alias
CreatedBy                      // Creator identity
FileAccess                     // Access control (public/private)
```

### Settings Domain (`domain/settings/`)

#### Errors (`domain/settings/errors.ts`)

```typescript
SettingsNotFoundError          // Settings not found
SettingsUpdateError            // Error updating settings
```

#### Abstractions (`domain/settings/abstractions.ts`)

```typescript
FileManagerConfig {            // Settings configuration
  uploadMinFileSize: number;
  uploadMaxFileSize: number;
  srcPrefix: string;
}
```

#### Types (`domain/settings/types.ts`)

```typescript
FileManagerSettings            // Settings entity
```

---

## Feature Dependencies (Implementation Order)

### Level 0: No Internal Dependencies
These features only depend on external systems (CMS, storage) and can be implemented first.

1. **GetSettings** - Read settings from CMS
2. **GetFile** - Read single file from CMS

### Level 1: Depends on Level 0
3. **ListFiles** - List files (may depend on GetSettings for validation)
4. **ListTags** - List unique tags from files
5. **UpdateSettings** - Update settings (depends on GetSettings)

### Level 2: Depends on Level 0-1
6. **CreateFile** - Create file (depends on GetSettings for validation)
7. **UpdateFile** - Update file (depends on GetFile)
8. **DeleteFile** - Delete file (depends on GetFile)

### Level 3: Depends on Level 2
9. **CreateFilesInBatch** - Batch create (depends on CreateFile logic)

### Composite
10. **FileManagerFeature** - Composite feature that registers all file and settings sub-features

---

## Feature Details

### 1. GetSettings Feature (`features/settings/GetSettings/`)

**Dependencies:**
- `GetSettings` (from `@webiny/api-core/features/settings/GetSettings`)
- `IdentityContext`
- `TenantContext`

**Repository:**
- Uses `GetSettings` from `@webiny/api-core` directly (no custom repository needed)

**Use Case:**
```typescript
export interface IGetSettingsUseCase {
    execute(): Promise<Result<FileManagerSettings | null, never>>;
}
```

**Implementation:**
- Calls `getSettings.execute({ name: "file-manager" })`
- Returns settings or null if not found
- No events (query operation)

**Errors:**
- Returns null on not found (no error)

**Files:**
- `abstractions.ts` - Use case interface
- `GetSettingsUseCase.ts` - Implementation
- `feature.ts` - Feature registration

---

### 2. GetFile Feature (`features/file/GetFile/`)

**Dependencies:**
- `GetEntryByIdUseCase` (from `@webiny/api-headless-cms/features/contentEntry/GetEntryById`)
- `IdentityContext`
- `FileModel` (from `domain/file/abstractions.ts`)

**Repository:**
- `GetFileRepository` - wraps GetEntryByIdUseCase with FileModel injection

```typescript
export interface IGetFileRepository {
    getById(id: string): Promise<CmsEntry<File> | null>;
}

class GetFileRepositoryImpl implements IGetFileRepository {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private fileModel: CmsModel,
        private identityContext: IdentityContext.Interface
    ) {}

    async getById(id: string) {
        return await this.identityContext.withoutAuthorization(async () => {
            const result = await this.getEntryById.execute(this.fileModel, id);
            return result.isOk() ? result.value : null;
        });
    }
}
```

**Use Case:**
```typescript
export interface IGetFileUseCase {
    execute(input: { id: string }): Promise<Result<File, UseCaseError>>;
}
```

**Implementation:**
- Calls repository.getById(id)
- Validates file permissions
- Converts CmsEntry to File domain object
- Returns File or FileNotFoundError

**Errors:**
- `FileNotFoundError` (from `domain/file/errors.ts`)

**Files:**
- `abstractions.ts` - Use case and repository interfaces
- `GetFileRepository.ts` - Repository implementation
- `GetFileUseCase.ts` - Use case implementation
- `feature.ts` - Feature registration

---

### 3. ListFiles Feature (`features/file/ListFiles/`)

**Dependencies:**
- `ListLatestEntriesUseCase` (from CMS)
- `IdentityContext`
- `FileModel` (from `domain/file/abstractions.ts`)
- `GetSettings` (optional, for validation)

**Repository:**
- `ListFilesRepository` - wraps ListLatestEntriesUseCase
- Handles where clause processing

**Use Case:**
- Applies permission filtering
- Supports search, pagination, sorting

**Errors:**
- `FileListError` (from `domain/file/errors.ts`)

**Input:**
```typescript
{
  search?: string;
  where?: Record<string, any>;
  limit?: number;
  after?: string;
  sort?: string[];
}
```

**Output:**
```typescript
{
  items: File[];
  meta: CmsEntryMeta;
}
```

---

### 4. ListTags Feature (`features/file/ListTags/`)

**Dependencies:**
- `GetUniqueFieldValuesUseCase` (from CMS)
- `IdentityContext`
- `FileModel` (from `domain/file/abstractions.ts`)

**Repository:**
- `ListTagsRepository` - wraps GetUniqueFieldValuesUseCase

**Use Case:**
- Returns unique tag values with counts

**Errors:**
- `FileListError` (from `domain/file/errors.ts`)

**Input:**
```typescript
{
  where?: Record<string, any>;
}
```

**Output:**
```typescript
{
  tag: string;
  count: number;
}[]
```

---

### 5. UpdateSettings Feature (`features/settings/UpdateSettings/`)

**Dependencies:**
- `UpdateSettings` (from `@webiny/api-core/features/settings/UpdateSettings`)
- `GetSettings` use case
- `IdentityContext`
- `TenantContext`
- `EventPublisher`

**Repository:**
- Uses `UpdateSettings` from `@webiny/api-core` directly (no custom repository needed)

**Use Case:**
```typescript
export interface IUpdateSettingsUseCase {
    execute(input: UpdateSettingsInput): Promise<Result<FileManagerSettings, UseCaseError>>;
}
```

**Implementation:**
- Validates settings input
- Calls `updateSettings.execute({ name: "file-manager", data: input })`
- Creates if not exists, updates if exists (handled by core UpdateSettings)
- Wraps with event decorator

**Event Decorator:**
- `UpdateSettingsEventsDecorator` - decorates use case with events
- Publishes events before/after/on-error

**Events:**
- `SettingsBeforeUpdateEvent`
- `SettingsAfterUpdateEvent`
- `SettingsUpdateErrorEvent`

**Errors:**
- `SettingsUpdateError` (from `domain/settings/errors.ts`)

**Input:**
```typescript
{
  uploadMinFileSize?: number;
  uploadMaxFileSize?: number;
  srcPrefix?: string;
}
```

**Files:**
- `abstractions.ts` - Use case interface, error interfaces
- `UpdateSettingsUseCase.ts` - Use case implementation
- `UpdateSettingsEventsDecorator.ts` - Events decorator
- `feature.ts` - Feature registration with decorator

---

### 6. CreateFile Feature (`features/file/CreateFile/`)

**Dependencies:**
- `CreateEntryUseCase` (from `@webiny/api-headless-cms/features/contentEntry/CreateEntry`)
- `GetSettingsUseCase` (from `features/settings/GetSettings`)
- `IdentityContext`
- `FileModel` (from `domain/file/abstractions.ts`)
- `EventPublisher`

**Repository:**
- `CreateFileRepository` - wraps CreateEntryUseCase with FileModel injection

```typescript
export interface ICreateFileRepository {
    create(data: FileInput): Promise<CmsEntry<File>>;
}

class CreateFileRepositoryImpl implements ICreateFileRepository {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private fileModel: CmsModel,
        private identityContext: IdentityContext.Interface
    ) {}

    async create(data: FileInput) {
        return await this.identityContext.withoutAuthorization(async () => {
            const result = await this.createEntry.execute(this.fileModel, data);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });
    }
}
```

**Use Case:**
```typescript
export interface ICreateFileUseCase {
    execute(input: CreateFileInput): Promise<Result<File, UseCaseError>>;
}
```

**Implementation:**
- Gets settings to validate file size
- Validates file size against settings (uploadMinFileSize, uploadMaxFileSize)
- Validates required fields
- Sets default values (tags, aliases)
- Calls repository.create(data)
- Converts CmsEntry to File domain object
- Wraps with event decorator

**Event Decorator:**
- `CreateFileEventsDecorator` - decorates use case with events
- Publishes events before/after/on-error

**Events:**
- `FileBeforeCreateEvent`
- `FileAfterCreateEvent`
- `FileCreateErrorEvent`

**Errors:**
- `FileCreateError` (from `domain/file/errors.ts`)
- `InvalidFileSizeError` (from `domain/file/errors.ts`)
- `FileAlreadyExistsError` (from `domain/file/errors.ts`)

**Input:**
```typescript
{
  key: string;
  size: number;
  type: string;
  name: string;
  meta?: Record<string, any>;
  tags?: string[];
  location?: { folderId: string };
  aliases?: string[];
}
```

**Files:**
- `abstractions.ts` - Use case, repository, and error interfaces
- `CreateFileRepository.ts` - Repository implementation
- `CreateFileUseCase.ts` - Use case implementation
- `CreateFileEventsDecorator.ts` - Events decorator
- `feature.ts` - Feature registration with decorator

---

### 7. UpdateFile Feature (`features/file/UpdateFile/`)

**Dependencies:**
- `UpdateEntryUseCase` (from CMS)
- `GetFile` use case
- `IdentityContext`
- `FileModel` (from `domain/file/abstractions.ts`)
- `EventPublisher`

**Repository:**
- `UpdateFileRepository` - wraps UpdateEntryUseCase

**Use Case:**
- Validates file exists
- Validates permissions
- Merges with existing data
- Publishes events

**Events:**
- `FileBeforeUpdateEvent`
- `FileAfterUpdateEvent`
- `FileUpdateErrorEvent`

**Errors:**
- `FileNotFoundError` (from `domain/file/errors.ts`)
- `FileUpdateError` (from `domain/file/errors.ts`)

**Input:**
```typescript
{
  name?: string;
  meta?: Record<string, any>;
  tags?: string[];
  location?: { folderId: string };
  aliases?: string[];
}
```

---

### 8. DeleteFile Feature (`features/file/DeleteFile/`)

**Dependencies:**
- `DeleteEntryUseCase` (from CMS)
- `GetFile` use case
- `IdentityContext`
- `FileModel` (from `domain/file/abstractions.ts`)
- `EventPublisher`

**Repository:**
- `DeleteFileRepository` - wraps DeleteEntryUseCase

**Use Case:**
- Validates file exists
- Validates permissions
- Publishes events
- Returns deleted file info

**Events:**
- `FileBeforeDeleteEvent`
- `FileAfterDeleteEvent`
- `FileDeleteErrorEvent`

**Errors:**
- `FileNotFoundError` (from `domain/file/errors.ts`)
- `FileDeleteError` (from `domain/file/errors.ts`)

---

### 9. CreateFilesInBatch Feature (`features/file/CreateFilesInBatch/`)

**Dependencies:**
- `CreateFile` use case (reuses logic)
- `GetSettings` use case
- `IdentityContext`
- `EventPublisher`

**Repository:**
- Reuses `CreateFileRepository`

**Use Case:**
- Validates each file
- Creates files in batch
- Publishes batch events

**Events:**
- `FileBeforeBatchCreateEvent`
- `FileAfterBatchCreateEvent`
- `FileBatchCreateErrorEvent`

**Errors:**
- `FileCreateError` (from `domain/file/errors.ts`)

**Input:**
```typescript
{
  files: FileInput[];
  meta?: Record<string, any>;
}
```

---

### 10. FileManagerFeature Composite Feature (`features/FileManagerFeature.ts`)

**Registers:**
- All sub-features in dependency order
- Domain abstractions:
  - `FileModel` (from `domain/file/abstractions.ts`)
  - `FileManagerConfig` (from `domain/settings/abstractions.ts`)

**Configuration:**
```typescript
{
  model: CmsModel;              # The fmFile model
  config: {
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
  }
}
```

---

## Event Types

All events follow EventPublisher pattern from `@webiny/api-core/features/EventPublisher`.

### File Events

```typescript
// Create
FileBeforeCreateEvent { file: File, meta?: Record<string, any> }
FileAfterCreateEvent { file: File, meta?: Record<string, any> }
FileCreateErrorEvent { input: FileInput, error: Error }

// Batch Create
FileBeforeBatchCreateEvent { files: File[], meta?: Record<string, any> }
FileAfterBatchCreateEvent { files: File[], meta?: Record<string, any> }
FileBatchCreateErrorEvent { inputs: FileInput[], error: Error }

// Update
FileBeforeUpdateEvent { original: File, file: File, input: Partial<FileInput> }
FileAfterUpdateEvent { original: File, file: File, input: Partial<FileInput> }
FileUpdateErrorEvent { id: string, input: Partial<FileInput>, error: Error }

// Delete
FileBeforeDeleteEvent { file: File }
FileAfterDeleteEvent { file: File }
FileDeleteErrorEvent { id: string, error: Error }
```

### Settings Events

```typescript
SettingsBeforeUpdateEvent {
  original: FileManagerSettings | null,
  settings: FileManagerSettings,
  input: Partial<FileManagerSettings>
}

SettingsAfterUpdateEvent {
  original: FileManagerSettings | null,
  settings: FileManagerSettings,
  input: Partial<FileManagerSettings>
}

SettingsUpdateErrorEvent {
  input: Partial<FileManagerSettings>,
  error: Error
}
```

---

## GraphQL Schema Migration

**Current:** `packages/api-file-manager/src/graphql/filesSchema.ts`

**Changes:**
- Replace `context.fileManager.*` calls with `context.container.resolve(UseCase)`
- Update resolvers to handle Result pattern
- Keep existing GraphQL schema structure (no breaking changes)

**Pattern:**
```typescript
async getFile(_, { id }, context) {
  await checkPermissions(context);
  const useCase = context.container.resolve(GetFileUseCase);
  const result = await useCase.execute({ id });
  if (result.isFail()) {
    throw result.error;
  }
  return result.value;
}
```

---

## CMS Use Cases Required

From `@webiny/api-headless-cms/features/contentEntry/`:

- `GetEntryByIdUseCase` - Get single entry by ID
- `GetEntryUseCase` - Get single entry by query
- `ListLatestEntriesUseCase` - List entries
- `CreateEntryUseCase` - Create entry
- `UpdateEntryUseCase` - Update entry
- `DeleteEntryUseCase` - Delete entry
- `GetUniqueFieldValuesUseCase` - Get unique field values

From `@webiny/api-headless-cms/features/contentModel/`:

- `GetModelUseCase` - Get CMS model by ID

---

## Migration Strategy

### Phase 1: Domain Layer
1. Move `src/cmsFileStorage/file.model.ts` to `domain/file/fileModel.ts`
2. Create `domain/file/errors.ts` with all file error types (extend BaseError)
3. Create `domain/file/abstractions.ts` for FileModel abstraction
4. Create `domain/file/types.ts` for file domain types
5. Create `domain/settings/errors.ts` with all settings error types (extend BaseError)
6. Create `domain/settings/abstractions.ts` for FileManagerConfig abstraction
7. Create `domain/settings/types.ts` for settings domain types

### Phase 2: Level 0 Features (2 features)
Each feature includes: abstractions, use case implementation, repository (if needed), events decorator (if needed), and feature registration.

8. **GetSettings** (`features/settings/GetSettings/`)
   - `abstractions.ts` - Interface
   - `GetSettingsUseCase.ts` - Implementation
   - `feature.ts` - Registration

9. **GetFile** (`features/file/GetFile/`)
   - `abstractions.ts` - Use case and repository interfaces
   - `GetFileRepository.ts` - Repository wrapping GetEntryByIdUseCase
   - `GetFileUseCase.ts` - Implementation
   - `feature.ts` - Registration

### Phase 3: Level 1 Features (3 features)
Each feature includes: abstractions, repository, use case, events decorator, and feature registration.

10. **ListFiles** (`features/file/ListFiles/`)
    - `abstractions.ts` - Interfaces
    - `ListFilesRepository.ts` - Repository wrapping ListLatestEntriesUseCase
    - `ListFilesUseCase.ts` - Implementation
    - `feature.ts` - Registration

11. **ListTags** (`features/file/ListTags/`)
    - `abstractions.ts` - Interfaces
    - `ListTagsRepository.ts` - Repository wrapping GetUniqueFieldValuesUseCase
    - `ListTagsUseCase.ts` - Implementation
    - `feature.ts` - Registration

12. **UpdateSettings** (`features/settings/UpdateSettings/`)
    - `abstractions.ts` - Interfaces with error types
    - `UpdateSettingsUseCase.ts` - Implementation
    - `UpdateSettingsEventsDecorator.ts` - Events decorator
    - `feature.ts` - Registration with decorator

### Phase 4: Level 2 Features (3 features)
Each feature includes: abstractions, repository, use case, events decorator, and feature registration.

13. **CreateFile** (`features/file/CreateFile/`)
    - `abstractions.ts` - Interfaces with error types
    - `CreateFileRepository.ts` - Repository wrapping CreateEntryUseCase
    - `CreateFileUseCase.ts` - Implementation with validation
    - `CreateFileEventsDecorator.ts` - Events decorator
    - `feature.ts` - Registration with decorator

14. **UpdateFile** (`features/file/UpdateFile/`)
    - `abstractions.ts` - Interfaces with error types
    - `UpdateFileRepository.ts` - Repository wrapping UpdateEntryUseCase
    - `UpdateFileUseCase.ts` - Implementation
    - `UpdateFileEventsDecorator.ts` - Events decorator
    - `feature.ts` - Registration with decorator

15. **DeleteFile** (`features/file/DeleteFile/`)
    - `abstractions.ts` - Interfaces with error types
    - `DeleteFileRepository.ts` - Repository wrapping DeleteEntryUseCase
    - `DeleteFileUseCase.ts` - Implementation
    - `DeleteFileEventsDecorator.ts` - Events decorator
    - `feature.ts` - Registration with decorator

### Phase 5: Level 3 Features (1 feature)
16. **CreateFilesInBatch** (`features/file/CreateFilesInBatch/`)
    - `abstractions.ts` - Interfaces with error types
    - `CreateFilesInBatchUseCase.ts` - Implementation (reuses CreateFile logic)
    - `CreateFilesInBatchEventsDecorator.ts` - Batch events decorator
    - `feature.ts` - Registration with decorator

### Phase 6: Integration
17. **FileManagerFeature** (`features/FileManagerFeature.ts`)
    - Composite feature that registers all sub-features in dependency order
    - Registers FileModel and FileManagerConfig via container.registerInstance

18. Update GraphQL schema (`graphql/schema.ts`)
    - Replace `context.fileManager.*` with `context.container.resolve(UseCase)`
    - Handle Result pattern (check isFail(), throw error or return value)

19. Update context setup
    - Register FileManagerFeature in main plugin
    - Pass CMS model and config to feature
    - Remove old CRUD factory pattern

---

## Out of Scope (Keep As-Is)

These components will remain unchanged for now:

1. **Physical Storage Layer** (`storage/FileStorage.ts`)
   - Handles cloud storage (S3) uploads/deletes
   - Can be migrated later if needed

2. **CmsFilesStorage** (`cmsFileStorage/CmsFilesStorage.ts`)
   - **DO NOT MIGRATE** - This god object will be replaced by feature-specific repositories
   - Each feature will have its own repository that wraps CMS use cases
   - Repositories will receive FileModel and CMS use cases via DI

3. **Asset Delivery** (`delivery/`)
   - Separate concern from file management
   - Already modular

4. **Plugins System** (`plugins/`)
   - Storage transform plugins
   - Keep existing plugin system

5. **Handlers** (`handlers/`)
   - Lambda handlers for S3 events
   - Separate deployment units

6. **Enterprise Features** (`enterprise/`)
   - Threat scanning wrapper
   - Keep as-is

7. **Model Modifier** (`modelModifier/`)
   - CMS model field modifications
   - Keep as-is

---

## Testing Strategy

Each feature should have:
1. **Unit tests** for use case logic
2. **Integration tests** for repository operations
3. **Event tests** for event publishing

Test files should mirror feature structure:
```
features/file/CreateFile/
├── __tests__/
│   ├── CreateFileUseCase.test.ts
│   ├── CreateFileRepository.test.ts
│   └── CreateFileEventsDecorator.test.ts
```

---

## Breaking Changes

**None expected.** This is an internal refactor that maintains:
- Same GraphQL API
- Same context.fileManager interface (initially)
- Same event payloads (migrated to EventPublisher)

**Future Deprecation:**
- `context.fileManager.*` methods (after features are stable)
- PubSub topics (replaced by EventPublisher events)

---

## Estimated Effort

- **Domain Layer** (7 files): 3-4 hours
  - Move model file, create errors, abstractions, types for both subdomains
- **Level 0 Features** (2 features, 5 files): 4-6 hours
  - GetSettings (3 files), GetFile (4 files with repository)
- **Level 1 Features** (3 features, 11 files): 8-12 hours
  - ListFiles (4 files), ListTags (4 files), UpdateSettings (5 files with decorator)
- **Level 2 Features** (3 features, 15 files): 12-16 hours
  - CreateFile (5 files), UpdateFile (5 files), DeleteFile (5 files) - all with decorators
- **Level 3 Features** (1 feature, 4 files): 4-5 hours
  - CreateFilesInBatch (4 files with decorator)
- **Integration** (2 tasks): 6-8 hours
  - FileManagerFeature composite, GraphQL schema migration, context setup
- **Testing**: 10-15 hours
  - Unit tests for all use cases, repositories, and decorators

**Total**: 47-66 hours (6-8 working days)

**Note**: Each feature is a complete vertical slice with abstractions, repositories, use cases, events decorators, and feature registration.

---

## Success Criteria

1. ✅ All file operations use DI-injected use cases via `context.container.resolve()`
2. ✅ No direct `context.cms` usage in features - only injected CMS use cases
3. ✅ All lifecycle events migrated to EventPublisher pattern with decorators
4. ✅ GraphQL schema uses use cases via container (no more `context.fileManager.*`)
5. ✅ Proper Result pattern for error handling (all use cases return `Result<T, Error>`)
6. ✅ Repository layer hides CMS implementation details
7. ✅ One repository per feature (no god objects like CmsFilesStorage)
8. ✅ Events handled via decorators (separated from business logic)
9. ✅ All existing tests pass
10. ✅ No breaking changes to public API (GraphQL schema remains the same)
11. ✅ FileModel registered as abstraction via `container.registerInstance()`
12. ✅ Each feature is complete vertical slice (abstractions, repo, use case, events, registration)
13. ✅ Settings features use `@webiny/api-core` GetSettings/UpdateSettings
14. ✅ All errors extend BaseError from `@webiny/feature/api`
