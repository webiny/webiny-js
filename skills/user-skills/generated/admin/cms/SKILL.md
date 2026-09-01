---
name: webiny-admin-cms-catalog
description: >
  admin/cms — 56 abstractions.
---

# admin/cms

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---

**Name:** `BulkActionFeature`
**Import:** `import { BulkActionFeature } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/bulkAction/feature.ts`

---

**Name:** `BulkActionUseCase`
**Import:** `import { BulkActionUseCase } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/bulkAction/abstractions.ts`

---

**Name:** `CmsContentEntry`
**Kind:** type
**Import:** `import type { CmsContentEntry } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms-common/types/index.ts`

---

**Name:** `CmsGraphQLClient`
**Import:** `import { CmsGraphQLClient } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/features/graphQLClient/index.ts`

---

**Name:** `CmsIdentity`
**Kind:** type
**Import:** `import type { CmsIdentity } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms-common/types/index.ts`

---

**Name:** `CmsModel`
**Kind:** type
**Import:** `import type { CmsModel } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms-common/types/index.ts`

---

**Name:** `CmsModelField`
**Kind:** type
**Import:** `import type { CmsModelField } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms-common/types/index.ts`

---

**Name:** `CmsModelLayoutField`
**Kind:** type
**Import:** `import type { CmsModelLayoutField } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms-common/types/index.ts`

---

**Name:** `ContentEntryEditorConfig`
**Import:** `import { ContentEntryEditorConfig } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/admin/config/contentEntries/index.ts`

---

**Name:** `ContentEntryForm`
**Import:** `import { ContentEntryForm } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.ts`

---

**Name:** `ContentEntryFormContent`
**Import:** `import { ContentEntryFormContent } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.ts`

---

**Name:** `ContentEntryFormModelModifier`
**Import:** `import { ContentEntryFormModelModifier } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.ts`

---

**Name:** `ContentEntryFormPresenter`
**Import:** `import { ContentEntryFormPresenter } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.ts`

---

**Name:** `ContentEntryListConfig`
**Import:** `import { ContentEntryListConfig } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/admin/config/contentEntries/index.ts`

---

**Name:** `Divider`
**Import:** `import { Divider } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `DropDown`
**Import:** `import { DropDown } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `DropDownItem`
**Import:** `import { DropDownItem } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `EntryAfterCreateEventHandler`
**Import:** `import { EntryAfterCreateEventHandler } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/events/index.ts`

---

**Name:** `EntryAfterCreatePayload`
**Kind:** type
**Import:** `import type { EntryAfterCreatePayload } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/events/index.ts`

---

**Name:** `EntryAfterDeleteEventHandler`
**Import:** `import { EntryAfterDeleteEventHandler } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/events/index.ts`

---

**Name:** `EntryAfterDeletePayload`
**Kind:** type
**Import:** `import type { EntryAfterDeletePayload } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/events/index.ts`

---

**Name:** `EntryAfterUpdateEventHandler`
**Import:** `import { EntryAfterUpdateEventHandler } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/events/index.ts`

---

**Name:** `EntryAfterUpdatePayload`
**Kind:** type
**Import:** `import type { EntryAfterUpdatePayload } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/events/index.ts`

---

**Name:** `GetEntryGraphQLFieldSelection`
**Import:** `import { GetEntryGraphQLFieldSelection } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/getEntry/abstractions.ts`

---

**Name:** `getNodeFromSelection`
**Import:** `import { getNodeFromSelection } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `IGetEntryGraphQLFieldSelection`
**Kind:** type
**Import:** `import type { IGetEntryGraphQLFieldSelection } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/getEntry/abstractions.ts`

---

**Name:** `IListEntriesGraphQLFieldSelection`
**Kind:** type
**Import:** `import type { IListEntriesGraphQLFieldSelection } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/listEntries/abstractions.ts`

---

**Name:** `IsModelPublishable`
**Import:** `import { IsModelPublishable } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/admin/components/IsModelPublishable.tsx`

---

**Name:** `Klass`
**Kind:** type
**Import:** `import type { Klass } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `LexicalEditor`
**Import:** `import { LexicalEditor } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/app-headless-cms/admin/components/LexicalCmsEditor/LexicalEditor.tsx`

---

**Name:** `LexicalEditorConfig`
**Import:** `import { LexicalEditorConfig } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/app-headless-cms/admin/lexicalConfig/LexicalEditorConfig.tsx`

---

**Name:** `LexicalEditorProps`
**Kind:** type
**Import:** `import type { LexicalEditorProps } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/app-headless-cms/admin/components/LexicalCmsEditor/LexicalEditor.tsx`

---

**Name:** `LexicalHtmlRenderer`
**Import:** `import { LexicalHtmlRenderer } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `LexicalNode`
**Kind:** type
**Import:** `import type { LexicalNode } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `ListEntriesGraphQLFieldSelection`
**Import:** `import { ListEntriesGraphQLFieldSelection } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/features/contentEntry/listEntries/abstractions.ts`

---

**Name:** `PermissionsEditor`
**Import:** `import { PermissionsEditor } from "webiny/admin/cms/model"`
**Source:** `@webiny/app-headless-cms/admin/components/FieldEditor/EditFieldDialog/PermissionsEditor/PermissionsEditor.tsx`

---

**Name:** `PublishEntryConfirmDialog`
**Import:** `import { PublishEntryConfirmDialog } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/admin/components/Dialogs/PublishEntryConfirmDialog.tsx`

---

**Name:** `RevisionsListPresenter`
**Import:** `import { RevisionsListPresenter } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/revisionsList/abstractions.ts`

---

**Name:** `Routes`
**Import:** `import { Routes } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/routes.ts`

---

**Name:** `RulesEditor`
**Import:** `import { RulesEditor } from "webiny/admin/cms/model"`
**Source:** `@webiny/app-headless-cms/admin/components/FieldEditor/EditFieldDialog/RulesEditor/index.ts`

---

**Name:** `TableRowMapper`
**Import:** `import { TableRowMapper } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/views/Table/abstractions.ts`

---

**Name:** `UnpublishEntryConfirmDialog`
**Import:** `import { UnpublishEntryConfirmDialog } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/admin/components/Dialogs/UnpublishEntryConfirmDialog.tsx`

---

**Name:** `useContentEntriesPresenter`
**Import:** `import { useContentEntriesPresenter } from "webiny/admin/cms/entry/list"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/list/useContentEntriesPresenter.tsx`

---

**Name:** `useContentEntryFormPresenter`
**Import:** `import { useContentEntryFormPresenter } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.tsx`

---

**Name:** `useCurrentElement`
**Import:** `import { useCurrentElement } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useCurrentSelection`
**Import:** `import { useCurrentSelection } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useDeriveValueFromSelection`
**Import:** `import { useDeriveValueFromSelection } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useFontColorPicker`
**Import:** `import { useFontColorPicker } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useIsMounted`
**Import:** `import { useIsMounted } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useLexicalEditorConfig`
**Import:** `import { useLexicalEditorConfig } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useModel`
**Import:** `import { useModel } from "webiny/admin/cms/entry/editor"`
**Source:** `@webiny/app-headless-cms/admin/components/ModelProvider/index.ts`
**Description:** Get model from the current context.

---

**Name:** `useModel`
**Import:** `import { useModel } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/admin/components/ModelProvider/index.ts`
**Description:** Get model from the current context.

---

**Name:** `usePermission`
**Import:** `import { usePermission } from "webiny/admin/cms"`
**Source:** `@webiny/app-headless-cms/admin/hooks/usePermission.ts`

---

**Name:** `useRichTextEditor`
**Import:** `import { useRichTextEditor } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useTextAlignmentAction`
**Import:** `import { useTextAlignmentAction } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---

**Name:** `useTypographyAction`
**Import:** `import { useTypographyAction } from "webiny/admin/cms/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/ui/lexical.ts`

---
