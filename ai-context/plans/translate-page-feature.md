# Translate Page Feature - Implementation Plan

IMPORTANT: use "webiny" MCP server to discover patterns and best practices before modifying any code.

## Overview
Build a complete translate page feature following Webiny Admin Architecture patterns:
1. **Headless ListLanguages feature** in `packages/languages/src/admin/features/` (reusable business logic)
2. **Headless TranslatePage feature** in `packages/app-website-builder/src/features/` (domain logic)
3. **Presentation layer** in `packages/app-website-builder/src/presentation/` (Presenter + UI)

## Architecture Principles (from webiny-admin-architect)

- **Headless features** (`features/`) = UseCase → Repository → Gateway (business logic, no UI)
- **Presentation features** (`presentation/`) = Presenter (MobX ViewModel) + hooks + components
- **All features MUST provide `resolve` function** for `useFeature()` hook
- **Use `createFeature` and `createAbstraction`** from `webiny/admin`
- **Namespace convention**: `export namespace MyAbstraction { export type Interface = ...; }`
- **Scoping**: UseCases = transient, Repositories/Gateways = singleton

---

## Phase 1: ListLanguages Headless Feature (packages/languages)

### Goal
Create a reusable headless feature for listing languages following the UseCase → Repository → Gateway pattern.

### File Structure
```
packages/languages/src/admin/features/listLanguages/
├── abstractions.ts          # All abstractions in one file
├── ListLanguagesUseCase.ts
├── ListLanguagesRepository.ts
├── ListLanguagesGateway.ts
├── feature.ts               # createFeature with resolve
└── index.ts                 # Public exports
```

### Implementation Details

#### 1. abstractions.ts (All abstractions in one file)
```typescript
import { createAbstraction } from "webiny/admin";

// DTO
export interface LanguageDto {
    id: string;
    code: string;
    name: string;
    direction?: "ltr" | "rtl";
    isDefault?: boolean;
    enabled?: boolean;
}

// UseCase
export interface IListLanguagesUseCase {
    execute(): Promise<LanguageDto[]>;
}

export const ListLanguagesUseCase = createAbstraction<IListLanguagesUseCase>("Languages/ListLanguagesUseCase");

export namespace ListLanguagesUseCase {
    export type Interface = IListLanguagesUseCase;
}

// Repository
export interface IListLanguagesRepository {
    execute(): Promise<LanguageDto[]>;
    getLanguages(): LanguageDto[];
}

export const ListLanguagesRepository = createAbstraction<IListLanguagesRepository>("Languages/ListLanguagesRepository");

export namespace ListLanguagesRepository {
    export type Interface = IListLanguagesRepository;
}

// Gateway
export interface IListLanguagesGateway {
    execute(): Promise<LanguageDto[]>;
}

export const ListLanguagesGateway = createAbstraction<IListLanguagesGateway>("Languages/ListLanguagesGateway");

export namespace ListLanguagesGateway {
    export type Interface = IListLanguagesGateway;
}
```

#### 2. ListLanguagesGateway.ts
```typescript
import { ListLanguagesGateway as GatewayAbstraction, LanguageDto } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const LIST_LANGUAGES = /* GraphQL */ `
    query ListLanguages {
        languages {
            listLanguages {
                data {
                    id
                    code
                    name
                    direction
                    isDefault
                    enabled
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

type ListLanguagesResponse = {
    languages: {
        listLanguages:
            | { data: LanguageDto[]; error: null }
            | { data: null; error: { code: string; message: string } };
    };
};

class ListLanguagesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<LanguageDto[]> {
        const response = await this.client.execute<ListLanguagesResponse>({
            query: LIST_LANGUAGES
        });

        const envelope = response.languages.listLanguages;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const ListLanguagesGateway = GatewayAbstraction.createImplementation({
    implementation: ListLanguagesGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

#### 3. ListLanguagesRepository.ts
```typescript
import { makeAutoObservable, runInAction } from "mobx";
import {
    ListLanguagesRepository as RepositoryAbstraction,
    ListLanguagesGateway,
    LanguageDto
} from "./abstractions.js";

class ListLanguagesRepositoryImpl implements RepositoryAbstraction.Interface {
    private languages: LanguageDto[] = [];

    constructor(private gateway: ListLanguagesGateway.Interface) {
        makeAutoObservable(this);
    }

    getLanguages(): LanguageDto[] {
        return this.languages;
    }

    async execute(): Promise<LanguageDto[]> {
        if (this.languages.length > 0) {
            return this.languages; // Already loaded — cache hit
        }

        const languages = await this.gateway.execute();
        runInAction(() => {
            this.languages = languages;
        });
        
        return this.languages;
    }
}

export const ListLanguagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLanguagesRepositoryImpl,
    dependencies: [ListLanguagesGateway]
});
```

#### 4. ListLanguagesUseCase.ts
```typescript
import { ListLanguagesUseCase as UseCaseAbstraction, ListLanguagesRepository, LanguageDto } from "./abstractions.js";

class ListLanguagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListLanguagesRepository.Interface) {}

    async execute(): Promise<LanguageDto[]> {
        return await this.repository.execute();
    }
}

export const ListLanguagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLanguagesUseCaseImpl,
    dependencies: [ListLanguagesRepository]
});
```

#### 5. feature.ts (MUST have resolve function)
```typescript
import { createFeature } from "webiny/admin";
import {
    ListLanguagesUseCase as UseCaseAbstraction,
    ListLanguagesRepository as RepositoryAbstraction
} from "./abstractions.js";
import { ListLanguagesUseCase } from "./ListLanguagesUseCase.js";
import { ListLanguagesRepository } from "./ListLanguagesRepository.js";
import { ListLanguagesGateway } from "./ListLanguagesGateway.js";

export const ListLanguagesFeature = createFeature({
    name: "Languages/ListLanguages",
    register(container) {
        container.register(ListLanguagesUseCase);
        container.register(ListLanguagesRepository).inSingletonScope();
        container.register(ListLanguagesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction),
            repository: container.resolve(RepositoryAbstraction)
        };
    }
});
```

#### 6. index.ts
```typescript
export { ListLanguagesFeature } from "./feature.js";
export type { LanguageDto } from "./abstractions.js";
```

#### 7. Register in languages Extension.tsx
```typescript
// packages/languages/src/admin/Extension.tsx
import { RegisterFeature } from "webiny/admin";
import { ListLanguagesFeature } from "./features/listLanguages/index.js";

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={ListLanguagesFeature} />
            {/* ... existing code ... */}
        </>
    );
};
```

---

## Phase 2: TranslatePage Headless Feature (packages/app-website-builder)

### Goal
Domain logic for translating pages using the new DI-powered feature pattern with `createAbstraction` and `createFeature`.

### File Structure
```
packages/app-website-builder/src/features/pages/translatePage/
├── abstractions.ts          # All abstractions (UseCase, Repository, Gateway)
├── TranslatePageUseCase.ts
├── TranslatePageRepository.ts
├── TranslatePageGateway.ts
├── feature.ts               # createFeature with resolve
└── index.ts                 # Public exports
```

### Implementation Details

#### 1. abstractions.ts (Refactor to use createAbstraction)
```typescript
import { createAbstraction } from "webiny/admin";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

// Params
export interface TranslatePageParams {
    id: string;
    languageCode: string;
    folderId: string;
}

// UseCase
export interface ITranslatePageUseCase {
    execute(params: TranslatePageParams): Promise<void>;
}

export const TranslatePageUseCase = createAbstraction<ITranslatePageUseCase>("WebsiteBuilder/TranslatePageUseCase");

export namespace TranslatePageUseCase {
    export type Interface = ITranslatePageUseCase;
    export type Params = TranslatePageParams;
}

// Repository
export interface TranslatePageRepositoryParams {
    pageId: string;
    languageCode: string;
    folderId: string;
}

export interface ITranslatePageRepository {
    execute(params: TranslatePageRepositoryParams): Promise<void>;
}

export const TranslatePageRepository = createAbstraction<ITranslatePageRepository>("WebsiteBuilder/TranslatePageRepository");

export namespace TranslatePageRepository {
    export type Interface = ITranslatePageRepository;
}

// Gateway
export interface TranslatePageGatewayParams {
    pageId: string;
    languageCode: string;
    folderId: string;
}

export interface ITranslatePageGateway {
    execute(params: TranslatePageGatewayParams): Promise<PageGatewayDto>;
}

export const TranslatePageGateway = createAbstraction<ITranslatePageGateway>("WebsiteBuilder/TranslatePageGateway");

export namespace TranslatePageGateway {
    export type Interface = ITranslatePageGateway;
}
```

#### 2. TranslatePageGateway.ts (Refactor to use MainGraphQLClient)
```typescript
import { TranslatePageGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

const TRANSLATE_PAGE = /* GraphQL */ `
    mutation TranslatePage($pageId: ID!, $languageCode: String!, $folderId: ID!) {
        websiteBuilder {
            translatePage(pageId: $pageId, languageCode: $languageCode, folderId: $folderId) {
                data {
                    id
                    entryId
                    properties {
                        title
                        path
                        language
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type TranslatePageResponse = {
    websiteBuilder: {
        translatePage:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class TranslatePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: GatewayAbstraction.Interface["execute"] extends (p: infer P) => any ? P : never): Promise<PageGatewayDto> {
        const response = await this.client.execute<TranslatePageResponse>({
            query: TRANSLATE_PAGE,
            variables: {
                pageId: params.pageId,
                languageCode: params.languageCode,
                folderId: params.folderId
            }
        });

        const envelope = response.websiteBuilder.translatePage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not translate page.");
        }

        return envelope.data;
    }
}

export const TranslatePageGateway = GatewayAbstraction.createImplementation({
    implementation: TranslatePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

#### 3. TranslatePageRepository.ts (Refactor to use DI)
```typescript
import { TranslatePageRepository as RepositoryAbstraction, TranslatePageGateway } from "./abstractions.js";
import { Page, pageListCache } from "~/domain/Page/index.js";

class TranslatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: TranslatePageGateway.Interface) {}

    async execute(params: RepositoryAbstraction.Interface["execute"] extends (p: infer P) => any ? P : never): Promise<void> {
        const result = await this.gateway.execute({
            pageId: params.pageId,
            languageCode: params.languageCode,
            folderId: params.folderId
        });
        
        // Add translated page to cache
        pageListCache.addItems([Page.create(result)]);
    }
}

export const TranslatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: TranslatePageRepositoryImpl,
    dependencies: [TranslatePageGateway]
});
```

#### 4. TranslatePageUseCase.ts (Refactor to use DI)
```typescript
import { TranslatePageUseCase as UseCaseAbstraction, TranslatePageRepository } from "./abstractions.js";

class TranslatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: TranslatePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<void> {
        await this.repository.execute({
            pageId: params.id,
            languageCode: params.languageCode,
            folderId: params.folderId
        });
    }
}

export const TranslatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: TranslatePageUseCaseImpl,
    dependencies: [TranslatePageRepository]
});
```

#### 5. feature.ts (NEW - proper DI registration)
```typescript
import { createFeature } from "webiny/admin";
import { TranslatePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TranslatePageUseCase } from "./TranslatePageUseCase.js";
import { TranslatePageRepository } from "./TranslatePageRepository.js";
import { TranslatePageGateway } from "./TranslatePageGateway.js";

export const TranslatePageFeature = createFeature({
    name: "WebsiteBuilder/TranslatePage",
    register(container) {
        container.register(TranslatePageUseCase);
        container.register(TranslatePageRepository).inSingletonScope();
        container.register(TranslatePageGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

#### 6. index.ts
```typescript
export { TranslatePageFeature } from "./feature.js";
export type { TranslatePageParams } from "./abstractions.js";
```

#### 7. Register in app-website-builder Extension.tsx
```typescript
// packages/app-website-builder/src/Extension.tsx
import { RegisterFeature } from "webiny/admin";
import { TranslatePageFeature } from "~/features/pages/translatePage/index.js";

export const Extension = () => {
    return (
        <>
            {/* Register headless feature */}
            <RegisterFeature feature={TranslatePageFeature} />
            
            {/* ... rest of the code ... */}
        </>
    );
};
```

---

## Phase 3: Presentation Layer (packages/app-website-builder)

### Goal
Simple presentation hook + Form-based Dialog + Action. No Presenter needed.

### File Structure
```
packages/app-website-builder/src/presentation/pages/TranslatePage/
└── hooks/
    └── useTranslatePage.ts  # React hook wrapping headless feature

packages/app-website-builder/src/modules/pages/
├── TranslatePageConfig.tsx  # Registers action in page list
├── TranslatePageDialog.tsx  # Form-based dialog
└── TranslatePageAction.tsx  # Action menu item
```

### Implementation Details

#### 1. presentation/pages/TranslatePage/hooks/useTranslatePage.ts
```typescript
import { useCallback } from "react";
import { useFeature } from "webiny/admin";
import { TranslatePageFeature } from "~/features/pages/translatePage/index.js";
import type { TranslatePageParams } from "~/features/pages/translatePage/index.js";

export const useTranslatePage = () => {
    const { useCase } = useFeature(TranslatePageFeature);

    const translatePage = useCallback(
        async (params: TranslatePageParams) => {
            await useCase.execute(params);
        },
        [useCase]
    );

    return {
        translatePage
    };
};
```

#### 2. modules/pages/TranslatePageAction.tsx
```typescript
import React from "react";
import { ReactComponent as TranslateIcon } from "@webiny/icons/translate.svg";
import { useDialogs } from "@webiny/app-admin";
import { Select } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { usePage } from "~/modules/pages/PagesList/hooks/usePage.js";
import { PageListConfig } from "~/modules/pages/configs/index.js";
import { useFeature } from "webiny/admin";
import { ListLanguagesFeature } from "@webiny/languages/admin/features/listLanguages";
import { useTranslatePage } from "~/presentation/pages/TranslatePage/hooks/useTranslatePage.js";
import { FolderSelector } from "~/components/FolderSelector.js";

const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

export const TranslatePageAction = () => {
    const dialogs = useDialogs();
    const { page } = usePage();
    const { translatePage } = useTranslatePage();
    const { useCase: listLanguagesUseCase } = useFeature(ListLanguagesFeature);

    const openTranslateDialog = async () => {
        // Load languages via use case - it returns the languages directly
        const languages = await listLanguagesUseCase.execute();

        dialogs.showDialog({
            title: "Translate Page",
            description: "Select a target language and destination folder",
            content: <TranslatePageForm languages={languages} />,
            loadingLabel: "Translating page...",
            onAccept: async data => {
                const { languageCode, folderId } = data as { languageCode: string; folderId: string };
                await translatePage({
                    id: page.id,
                    languageCode,
                    folderId
                });
            }
        });
    };

    return (
        <OptionsMenuItem
            icon={<TranslateIcon />}
            label="Translate"
            onAction={openTranslateDialog}
        />
    );
};

interface TranslatePageFormProps {
    languages: Array<{ code: string; name: string }>;
}

const TranslatePageForm = ({ languages }: TranslatePageFormProps) => {
    return (
        <>
            <Bind name="languageCode" validators={[validation.create("required")]}>
                <Select
                    label="Target Language"
                    placeholder="Select a language"
                    options={languages.map(lang => ({
                        value: lang.code,
                        label: lang.name
                    }))}
                />
            </Bind>
            
            <Bind name="folderId" validators={[validation.create("required")]}>
                <FolderSelector
                    label="Destination Folder"
                    placeholder="Select a folder"
                />
            </Bind>
        </>
    );
};
```

#### 3. modules/pages/TranslatePageConfig.tsx
```typescript
import React from "react";
import { InternalPageListConfig } from "./configs/list/index.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { TranslatePageAction } from "./TranslatePageAction.js";

const { Browser } = InternalPageListConfig;

export const TranslatePageConfig = () => {
    return (
        <InternalPageListConfig>
            <HasPermission entity="page" action="create">
                <Browser.Page.Action name="translate" element={<TranslatePageAction />} />
            </HasPermission>
        </InternalPageListConfig>
    );
};
```

---

## Phase 4: Integration

### Extension.tsx Updates
```typescript
// packages/app-website-builder/src/Extension.tsx
import { RegisterFeature } from "webiny/admin";
import { TranslatePageFeature } from "~/features/pages/translatePage/index.js";
import { TranslatePageConfig } from "~/modules/pages/TranslatePageConfig.js";

export const Extension = () => {
    return (
        <>
            {/* Register headless feature */}
            <RegisterFeature feature={TranslatePageFeature} />
            
            {/* ... existing code ... */}
            
            <PagesListConfig />
            <TranslatePageConfig />
            <RedirectsListConfig />
        </>
    );
};
```

---

## Key Architecture Decisions

### Following webiny-admin-architect Patterns

1. **All abstractions use `createAbstraction` from `webiny/admin`**
   - Not from `@webiny/feature/admin` (old pattern)
   - Namespace convention: `export namespace MyAbstraction { export type Interface = ...; }`

2. **All features use `createFeature` with mandatory `resolve`**
   - `resolve` function is REQUIRED for `useFeature()` hook
   - Returns resolved instances from DI container

3. **Headless vs Presentation separation**
   - Headless (`features/`): UseCase → Repository → Gateway
   - Presentation (`presentation/`): Simple hooks wrapping headless features
   - No Presenter needed for simple forms - use `@webiny/form` directly

4. **Scoping rules**
   - UseCases: transient (default)
   - Repositories/Gateways: singleton (`.inSingletonScope()`)

5. **GraphQL Gateway pattern**
   - Inject `MainGraphQLClient` from `@webiny/app/features/mainGraphQLClient`
   - Define query as `/* GraphQL */` string constant
   - Type the response shape explicitly
   - Handle `data`/`error` envelope pattern

6. **Toast notifications**
   - Use `useToast()` from `@webiny/admin-ui`
   - `showToast({ message, type: "success" | "error" })`

7. **`useFeature` is the bridge**
   - Presentation hooks call `useFeature(SomeFeature)` to get resolved exports
   - Wrap for clean React API

### Reusability

- `ListLanguages` feature can be used anywhere in admin (languages package)
- `TranslatePage` headless feature is UI-agnostic (app-website-builder)
- Presentation layer is minimal - just a hook and form-based dialog

### Error Handling

- Gateway throws errors with user-friendly messages
- Dialog catches errors and displays via `useToast()`
- Form validation handles required fields

### Performance

- Languages are cached in Repository after first fetch
- Singleton scope prevents duplicate instances
- MobX reactivity in Repository ensures efficient updates

---

## Implementation Order

1. ✅ Phase 2 (partially done) - TranslatePage headless feature files created (old pattern)
2. 🔄 Phase 1 - ListLanguages headless feature (NEXT - following new architecture)
3. 🔄 Phase 2 - Refactor TranslatePage to use DI pattern with feature.ts
4. 🔄 Phase 3 - Presentation layer (hook + Form-based dialog + action)
5. 🔄 Phase 4 - Integration in Extension.tsx

---

## Testing Strategy

### Unit Tests
- Test use cases with mock repositories
- Test repositories with mock gateways
- Test presenter logic with mock dependencies

### Integration Tests
- Test GraphQL queries/mutations
- Test MobX reactivity
- Test error scenarios

### E2E Tests
- Test full translate flow in UI
- Test permission checks
- Test error messages display

---

## Migration Notes

The existing `translatePage` files in `packages/app-website-builder/src/features/pages/translatePage/` use an older factory pattern (similar to `duplicatePage`). We're keeping them AS-IS and wrapping with a proper `feature.ts` for consistency with the new architecture. This hybrid approach:

- ✅ Preserves working code
- ✅ Adds proper DI registration layer
- ✅ Makes it consumable via `useFeature()` if needed
- ✅ Provides a clean `useTranslatePage()` hook for React

Future refactoring could convert the entire `translatePage` feature to use `createAbstraction` pattern, but that's not required for this implementation.
