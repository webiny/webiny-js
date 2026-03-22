---
name: webiny-admin-website-builder-catalog
context: webiny-api
description: >
  admin/website-builder — 55 abstractions.
---

# admin/website-builder

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---
**Name:** `$addElementReferenceToParent`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$createElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$deleteElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$deselectElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getActiveElementId`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getComponentManifestByElementId`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getElementById`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getElementInputValues`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getElementsOfType`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$getFirstElementOfType`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$highlightElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$moveElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$previewElementInputs`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`
**Description:** Programmatically update an element's inputs in the preview iframe only (via JSON patch).
Does NOT write to the editor document state.

---
**Name:** `$removeElementReferenceFromParent`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$selectElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`

---
**Name:** `$updateElementInputs`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/utils/index.ts`
**Description:** Programmatically update an element's inputs using a callback-based API.
The updater receives a deep object representation of the element's inputs
which can be mutated in place.

---
**Name:** `Commands`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/index.tsx`

---
**Name:** `CompactEditorConfig`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/app-website-builder/inputRenderers/LexicalInput/LexicalEditorConfig.tsx`

---
**Name:** `createCommand`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/editorSdk/createCommand.ts`

---
**Name:** `createElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/website-builder-sdk/index.ts`

---
**Name:** `Divider`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `DropDown`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `DropDownItem`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `EcommerceIntegration`
**Import:** `webiny/admin/website-builder`
**Source:** `@webiny/app-website-builder/ecommerce/index.tsx`

---
**Name:** `ElementInputs`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/defaultConfig/Sidebar/ElementSettings/ElementInputs.tsx`

---
**Name:** `ExpandedEditorConfig`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/app-website-builder/inputRenderers/LexicalInput/LexicalEditorConfig.tsx`

---
**Name:** `getNodeFromSelection`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `LexicalHtmlRenderer`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `PageEditorConfig`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/modules/pages/PageEditor/PageEditorConfig.tsx`

---
**Name:** `PageListConfig`
**Import:** `webiny/admin/website-builder/page/list`
**Source:** `@webiny/app-website-builder/index.ts`

---
**Name:** `pagePathFromTitle`
**Import:** `webiny/admin/website-builder`
**Source:** `@webiny/app-website-builder/index.ts`

---
**Name:** `RedirectListConfig`
**Import:** `webiny/admin/website-builder/redirect/list`
**Source:** `@webiny/app-website-builder/index.ts`

---
**Name:** `Routes`
**Import:** `webiny/admin/website-builder`
**Source:** `@webiny/app-website-builder/routes.ts`

---
**Name:** `useActiveElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useActiveElement.ts`

---
**Name:** `useComponent`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useComponent.ts`

---
**Name:** `useCreateElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useCreateElement.ts`

---
**Name:** `useCurrentElement`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useCurrentSelection`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useDeleteElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useDeleteElement.ts`

---
**Name:** `useDeriveValueFromSelection`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useDocumentEditor`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/DocumentEditor/index.ts`

---
**Name:** `useElementInputs`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useElementInputs.ts`
**Description:** Returns the resolved input values for the given element, plus an updater callback.

---
**Name:** `useElementOverlay`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useElementOverlay.ts`

---
**Name:** `useFontColorPicker`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useHighlightedElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useHighlightedElement.ts`

---
**Name:** `useIsMounted`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useLexicalEditorConfig`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `usePageEditorConfig`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/modules/pages/PageEditor/usePageEditorConfig.ts`

---
**Name:** `usePermissions`
**Import:** `webiny/admin/website-builder`
**Source:** `@webiny/app-website-builder/presentation/security/usePermissions.ts`

---
**Name:** `useRichTextEditor`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useSelectFromDocument`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.ts`
**Description:** Subscribe to part of the document state.

---
**Name:** `useSelectFromEditor`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useSelectFromEditor.ts`
**Description:** Subscribe to part of the document state.

---
**Name:** `useTextAlignmentAction`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useTypographyAction`
**Import:** `webiny/admin/website-builder/lexical`
**Source:** `@webiny/lexical-editor/exports/admin/lexical.ts`

---
**Name:** `useUpdateElement`
**Import:** `webiny/admin/website-builder/page/editor`
**Source:** `@webiny/app-website-builder/BaseEditor/hooks/useUpdateElement.ts`

---
