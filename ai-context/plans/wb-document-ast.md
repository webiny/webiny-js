# DocumentAST — AI-friendly page document transformer

## Context

The website builder stores page content in a flat structure: an `elements` map (element definitions with parent references) and a `bindings` map (input values and styles per element). This is efficient for the editor but opaque to an LLM. We need a utility that converts this structure into a minimal, readable AST for use in AI prompts, and can apply patches (arrays of explicit actions) back to the original document via `IDocumentOperation[]`.

## Decisions

- **Rich text**: HTML string only (strip Lexical `state` JSON from AST output)
- **Layout**: Preserve full element tree with nesting
- **Patch format**: Array of explicit actions (`update`, `remove`, `moveBefore`, `moveAfter`, `createElement`)
- **Patch output**: `applyPatch()` returns `IDocumentOperation[]` — no `toDocument()` needed
- **Package**: `packages/app-website-builder/`
- **No Lexical dependency**: HTML→Lexical conversion happens in the tool pipeline before `applyPatch()`
- **Page metadata**: Minimal header (id, title, path, language)
- **No available components in AST**: Caller assembles component catalog for LLM prompt separately
- **No assets catalog**: Backend provides a tool for asset lookup at LLM call time

## API

```ts
const ast = DocumentAST.fromDocument(document);
const json = ast.toJSON(); // AI-friendly AST for LLM prompt

// After LLM responds and tool pipeline resolves tool envelopes:
const ops = ast.applyPatch(actions, { components }); // Returns IDocumentOperation[]
ops.forEach(op => op.apply(document)); // Apply to document
// `components` is Record<string, ComponentManifest>, needed by ElementFactory for createElement actions
// Can be omitted if patch only contains update/remove/move actions
```

## AST Output Shape (`toJSON()`)

```ts
interface DocumentASTOutput {
  page: { id: string; title: string; path: string; language: string };
  layout: ASTNode[];
}

interface ASTNode {
  id: string; // Element ID
  type: string; // Human-readable: "richText", "image", "box", "grid", etc.
  component: string; // Original: "Webiny/Lexical", "Webiny/Image", etc.
  inputs: Record<string, ASTInputValue>;
  children?: ASTNode[];
}

// Per binding type:
// lexical  → { inputId, html }
// file     → { inputId, assetId, src }
// text     → { inputId, value }
// number   → { inputId, value }
// boolean  → { inputId, value }
// color    → { inputId, value }
// select   → { inputId, value }
// slot/object → skipped (structural)
```

## Patch Format (input to `applyPatch()`)

A single array of explicitly typed actions:

```ts
type ASTPatchAction =
  | { action: "update"; id: string; inputs: Record<string, any> }
  | { action: "remove"; id: string }
  | { action: "moveBefore"; id: string; targetId: string }
  | { action: "moveAfter"; id: string; targetId: string }
  | {
      action: "createElement";
      parentId: string;
      slot: string;
      index?: number;
      params: { component: string; inputs: Record<string, any> };
    };
```

### Action → Document Operation mapping

| Patch Action    | Document Operations                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `update`        | `SetGlobalInputBinding` per changed input                                                                         |
| `remove`        | `RemoveElement` (recursively removes descendants)                                                                 |
| `moveBefore`    | Remove element ref from parent slot, re-insert before targetId                                                    |
| `moveAfter`     | Remove element ref from parent slot, re-insert after targetId                                                     |
| `createElement` | `ElementFactory.createElementFromComponent()` → returns `AddElement`, `AddToParent`, `SetGlobalInputBinding` etc. |

### Update action — input value mapping back to bindings

The `update` action carries input values in AST format. The class maps them back:

- `{ html: "..." }` for lexical → writes to `bindings[id].inputs[name].static` (expects `{ state, html }` — tool pipeline already converted)
- `{ assetId, src }` for file → writes to `bindings[id].inputs[name].static.id` and `.src`
- `{ value: ... }` for text/number/boolean/etc → writes to `bindings[id].inputs[name].static`

## Files to Create/Modify

| File                                                             | Action                    |
| ---------------------------------------------------------------- | ------------------------- |
| `packages/app-website-builder/src/DocumentAST.ts`                | Create — main class       |
| `packages/app-website-builder/src/DocumentAST.types.ts`          | Create — type definitions |
| `packages/app-website-builder/src/__tests__/DocumentAST.test.ts` | Create — tests            |

## Key Implementation Details

### Tree Building (`fromDocument`)

1. Deep-clone the document (for internal reference)
2. Find root element (`component.name === "Webiny/Root"`)
3. Get root's children from `bindings["root"].inputs.children.static` (ordered array of IDs)
4. Recursively build `ASTNode` tree via `buildNode(elementId)`

### Child Resolution — Two Patterns

**Simple children** (Box, GridColumn, Root): `bindings[id].inputs.children` has `type: "slot"`, `list: true`, `static: ["childId1", "childId2"]` → recurse in order.

**Grid columns**: Grid manifest has `columns` as `ObjectInput({ list: true, fields: [SlotInput({ name: "children", list: false })] })`. In bindings:

- `columns` → `{ type: "object", list: true }` (skip)
- `columns/0/children` → `{ type: "slot", static: "gridColumnId" }` (single, not list)
- `columns/1/children` → `{ type: "slot", static: "gridColumnId" }`

Detect by checking for `columns/N/children` paths in bindings. Each slot points to a GridColumn element, which has its own `children` slot.

### Input Extraction

Skip `type: "slot"` (structural), `type: "object"` (metadata), and indexed paths (`/\d+/`). Map remaining bindings to AST input shapes using the type-specific rules above.

### Component Name → AST Type

Static map with fallback:

```
"Webiny/Root" → "root", "Webiny/Lexical" → "richText", "Webiny/Image" → "image",
"Webiny/Box" → "box", "Webiny/Grid" → "grid", "Webiny/GridColumn" → "gridColumn"
Fallback: strip namespace, lowerCamelCase → "MyPlugin/HeroBanner" → "heroBanner"
```

### `applyPatch()` Implementation

Returns `IDocumentOperation[]`. For each action:

**`update`**: For each input in `action.inputs`, find the original binding at `document.bindings[action.id].inputs[inputName]`. Create `SetGlobalInputBinding` with the updated `static` value. The class knows the binding type from the original document, so it can write the correct shape.

**`remove`**: Create `new RemoveElement(action.id)`.

**`moveBefore` / `moveAfter`**: Use the existing `$moveElement` from `src/editorSdk/utils/$moveElement.ts`. Resolve the target index by finding `targetId` in the parent's slot `static` array and offsetting by 0 (before) or 1 (after). Since we're in `app-website-builder`, we have direct access to `$moveElement`, `$removeElementReferenceFromParent`, and `$addElementReferenceToParent`.

**`createElement`**: Delegate to `ElementFactory.createElementFromComponent({ componentName: action.params.component, parentId: action.parentId, slot: action.slot, index: action.index, bindings: { inputs: action.params.inputs } })`. This returns all needed operations (AddElement, AddToParent, SetGlobalInputBinding, etc.), including recursive nested element creation via `CreateElement` actions in inputs.

## Existing Code to Reuse

| Utility                                                                                     | Package / Path                                             | Usage                                          |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `Document`, `DocumentElement`, `DocumentBindings`, `InputValueBinding`, `ComponentManifest` | `@webiny/website-builder-sdk/types`                        | Core types                                     |
| `IDocumentOperation`                                                                        | `@webiny/website-builder-sdk/documentOperations`           | Return type of `applyPatch()`                  |
| `DocumentOperations.*`                                                                      | `@webiny/website-builder-sdk/documentOperations`           | `SetGlobalInputBinding`, `RemoveElement`, etc. |
| `ElementFactory`                                                                            | `@webiny/website-builder-sdk`                              | `createElement` action handling                |
| `$moveElement`                                                                              | `src/editorSdk/utils/$moveElement.ts`                      | Move element between parents/positions         |
| `$removeElementReferenceFromParent`                                                         | `src/editorSdk/utils/$removeElementReferenceFromParent.ts` | Remove element ref from parent slot            |
| `$addElementReferenceToParent`                                                              | `src/editorSdk/utils/$addElementReferenceToParent.ts`      | Add element ref to parent slot                 |
| `$deleteElement`                                                                            | `src/editorSdk/utils/$deleteElement.ts`                    | Delete element and descendants                 |

## Verification

1. Write unit tests using `documentState.json` as a fixture
2. Test `toJSON()` produces correct AST shape with preserved IDs
3. Test `update` action: modify HTML on a Lexical element, verify `SetGlobalInputBinding` targets correct binding path
4. Test `remove` action: verify `RemoveElement` operation is produced
5. Test `moveBefore`/`moveAfter`: verify slot binding array is rewritten correctly
6. Test `createElement` action: verify `ElementFactory` is called with correct params
7. Test Grid nesting: fixture with Grid → GridColumn → Lexical, verify tree structure
8. Run `yarn test packages/app-website-builder`
