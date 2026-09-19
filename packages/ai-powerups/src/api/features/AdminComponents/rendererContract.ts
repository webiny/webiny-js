import { TYPE_SURFACE } from "./typeSurface.generated.js";

/**
 * What a generated field renderer may contain.
 *
 * Two halves, deliberately. `TYPE_SURFACE` is generated from the built types of `admin-ui` and
 * `app-admin`, so every prop name, every size union and every view model member comes from the
 * compiler rather than from someone remembering to write it down. The rules below are the part no
 * type can state: that `sort={false}` is effectively mandatory, that a renderer must not keep the
 * field's data in local state, that a wrong prop name fails silently rather than loudly.
 *
 * The split exists because the prose version was wrong three times in a row, and each time the
 * correct answer was already sitting in a `.d.ts`. Anything a compiler can answer is generated. Add
 * to the rules only when the types genuinely cannot carry it, and regenerate rather than hand-edit
 * when a component changes.
 */
export const RENDERER_CONTRACT = `A field renderer is one TSX file with NO import statements. Everything it may use is already in scope:

- React, and the hooks through it: React.useState, React.useMemo, React.useCallback.
- observer, from mobx-react-lite. Wrap the component in it. The field view model is observable, and without observer the inputs will not update as the user types.
- createFieldRenderer and createObjectFieldRenderer.
- The components listed below, by name.

Rules:
- Declare the component as \`const Renderer = ...\`. That exact name is what gets loaded.
- No imports, no fetch, no direct DOM access, no globals beyond the above. Anything else fails to load.
- Use only the components below, with exactly the props below. React silently drops a prop it does not recognise, so a guessed prop name does not throw: you get a component that renders nothing, or ignores you. This is the single most common way these renderers fail.
- Props not listed for a component still work if the underlying DOM element takes them: className, style, onFocus and so on.
- IconButton has no \`label\` prop. Use aria-label.
- Styling is yours to choose. className with the admin's utility classes is preferred; an inline style object is fine where there is no class for it.

Working with the field:
- Render the label. field.label is there, and a renderer that drops it leaves the form unreadable, so use FormComponentLabel unless you are deliberately replacing it.
- Single value: read field.value, write it with field.onChange(next), and call field.onBlur() on blur so validation runs when the form expects it.
- List of objects: field.items, field.addItem(), field.moveItem(from, to), and item.remove() per item. Reach a child with item.fields.find(f => f.name === "<childName>") and use its .value and .onChange.
- Never copy the field's data into local state. Call the model and let observer re-render. Local state is what makes a renderer drift out of sync with the form.
- field.validation is the RESULT of validation, not the rules that produced it. The field does not expose its configured validators at all, so a renderer cannot read a maxLength or a pattern. If you need one, it is not available.

Tree, for drag-and-drop ordering. It wraps @minoru/react-dnd-treeview and does NOT re-expose that library's props, so write it from the signature below and not from memory of that library:
- Pass sort={false}. Without it Tree sorts rows by label, which silently reorders a list whose order IS the data. Nothing throws and the stored data stays correct; only the screen disagrees with it.
- A node goes IN as { id, label, parentId, droppable, data: { ... } }, with your own data nested under \`data\`.
- It comes back OUT flat: the renderer callback receives one object with the defaults and your data merged together, so it is node.yourKey, not node.data.yourKey.
- ids and parentIds are strings.
- In onDrop, work out the new order from the newTree argument (filter to your rootId, map to ids) rather than from a drop index.

${TYPE_SURFACE}`;
