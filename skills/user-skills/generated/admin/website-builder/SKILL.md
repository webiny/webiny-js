---
name: webiny-admin-website-builder-catalog
context: webiny-api
description: >
  admin/website-builder — 59 abstractions.
---

# admin/website-builder

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---
**Name:** `$addElementReferenceToParent`
**Import:** `import { $addElementReferenceToParent } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$createElement`
**Import:** `import { $createElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$deleteElement`
**Import:** `import { $deleteElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$deselectElement`
**Import:** `import { $deselectElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getActiveElementId`
**Import:** `import { $getActiveElementId } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getComponentManifestByElementId`
**Import:** `import { $getComponentManifestByElementId } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getElementById`
**Import:** `import { $getElementById } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getElementInputValues`
**Import:** `import { $getElementInputValues } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getElementsOfType`
**Import:** `import { $getElementsOfType } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getFirstElementOfType`
**Import:** `import { $getFirstElementOfType } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$highlightElement`
**Import:** `import { $highlightElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$moveElement`
**Import:** `import { $moveElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$previewElementInputs`
**Import:** `import { $previewElementInputs } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`
**Description:** Programmatically update an element's inputs in the preview iframe only (via JSON patch).
Does NOT write to the editor document state.

---
**Name:** `$removeElementReferenceFromParent`
**Import:** `import { $removeElementReferenceFromParent } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$selectElement`
**Import:** `import { $selectElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$updateElementInputs`
**Import:** `import { $updateElementInputs } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`
**Description:** Programmatically update an element's inputs using a callback-based API.
The updater receives a deep object representation of the element's inputs
which can be mutated in place.

---
**Name:** `Commands`
**Import:** `import { Commands } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/index.tsx`

---
**Name:** `CompactEditorConfig`
**Import:** `import { CompactEditorConfig } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/app-website-builder/inputRenderers/LexicalInput/LexicalEditorConfig.tsx`

---
**Name:** `createCommand`
**Import:** `import { createCommand } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/editorSdk/createCommand.ts`

---
**Name:** `createElement`
**Import:** `import { createElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/website-builder-sdk/index.ts`

---
**Name:** `Divider`
**Import:** `import { Divider } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `DropDown`
**Import:** `import { DropDown } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `DropDownItem`
**Import:** `import { DropDownItem } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `EcommerceIntegration`
**Import:** `import { EcommerceIntegration } from "webiny/admin/website-builder"`
**Source:** `@webiny/app-website-builder/ecommerce/index.tsx`

---
**Name:** `ElementInputs`
**Import:** `import { ElementInputs } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/defaultConfig/Sidebar/ElementSettings/ElementInputs.tsx`

---
**Name:** `ExpandedEditorConfig`
**Import:** `import { ExpandedEditorConfig } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/app-website-builder/inputRenderers/LexicalInput/LexicalEditorConfig.tsx`

---
**Name:** `getNodeFromSelection`
**Import:** `import { getNodeFromSelection } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `HasPermission`
**Import:** `import { HasPermission } from "webiny/admin/website-builder"`
**Source:** `@webiny/app-website-builder/presentation/security/HasPermission.tsx`

---
**Name:** `Klass`
**Kind:** type
**Import:** `import type { Klass } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `LexicalHtmlRenderer`
**Import:** `import { LexicalHtmlRenderer } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `LexicalNode`
**Kind:** type
**Import:** `import type { LexicalNode } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `PageEditorConfig`
**Import:** `import { PageEditorConfig } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/modules/pages/PageEditor/PageEditorConfig.tsx`

---
**Name:** `PageListConfig`
**Import:** `import { PageListConfig } from "webiny/admin/website-builder/page/list"`
**Source:** `@webiny/app-website-builder/index.ts`

---
**Name:** `pagePathFromTitle`
**Import:** `import { pagePathFromTitle } from "webiny/admin/website-builder"`
**Source:** `@webiny/app-website-builder/index.ts`

---
**Name:** `RedirectListConfig`
**Import:** `import { RedirectListConfig } from "webiny/admin/website-builder/redirect/list"`
**Source:** `@webiny/app-website-builder/index.ts`

---
**Name:** `Routes`
**Import:** `import { Routes } from "webiny/admin/website-builder"`
**Source:** `@webiny/app-website-builder/routes.ts`

---
**Name:** `useActiveElement`
**Import:** `import { useActiveElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useActiveElement.ts`

---
**Name:** `useComponent`
**Import:** `import { useComponent } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useComponent.ts`

---
**Name:** `useCreateElement`
**Import:** `import { useCreateElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useCreateElement.ts`

---
**Name:** `useCurrentElement`
**Import:** `import { useCurrentElement } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useCurrentSelection`
**Import:** `import { useCurrentSelection } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useDeleteElement`
**Import:** `import { useDeleteElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useDeleteElement.ts`

---
**Name:** `useDeriveValueFromSelection`
**Import:** `import { useDeriveValueFromSelection } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useDocumentEditor`
**Import:** `import { useDocumentEditor } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/DocumentEditor/index.ts`

---
**Name:** `useElementComponentManifest`
**Import:** `import { useElementComponentManifest } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/defaultConfig/Content/Preview/useElementComponentManifest.ts`

---
**Name:** `useElementInputs`
**Import:** `import { useElementInputs } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useElementInputs.ts`
**Description:** Returns the resolved input values for the given element, plus an updater callback.

---
**Name:** `useElementOverlay`
**Import:** `import { useElementOverlay } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useElementOverlay.ts`

---
**Name:** `useFontColorPicker`
**Import:** `import { useFontColorPicker } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useHighlightedElement`
**Import:** `import { useHighlightedElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useHighlightedElement.ts`

---
**Name:** `useIsMounted`
**Import:** `import { useIsMounted } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useLexicalEditorConfig`
**Import:** `import { useLexicalEditorConfig } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `usePageEditorConfig`
**Import:** `import { usePageEditorConfig } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/modules/pages/PageEditor/usePageEditorConfig.ts`

---
**Name:** `usePermissions`
**Import:** `import { usePermissions } from "webiny/admin/website-builder"`
**Source:** `@webiny/app-website-builder/presentation/security/usePermissions.ts`

---
**Name:** `useRichTextEditor`
**Import:** `import { useRichTextEditor } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useSelectFromDocument`
**Import:** `import { useSelectFromDocument } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.ts`
**Description:** Subscribe to part of the document state.

---
**Name:** `useSelectFromEditor`
**Import:** `import { useSelectFromEditor } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.ts`
**Description:** Subscribe to part of the document state.

---
**Name:** `useTextAlignmentAction`
**Import:** `import { useTextAlignmentAction } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useTypographyAction`
**Import:** `import { useTypographyAction } from "webiny/admin/website-builder/lexical"`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useUpdateElement`
**Import:** `import { useUpdateElement } from "webiny/admin/website-builder/page/editor"`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useUpdateElement.ts`

---
