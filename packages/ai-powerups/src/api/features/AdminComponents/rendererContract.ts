/**
 * What a generated field renderer may contain.
 *
 * This is the whole trust model and the whole API surface, in one string. It is imported by both the
 * tool description and the assistant's guidance so the two cannot drift.
 *
 * The specifics here are not decoration. Generating this renderer cold produced three bugs, and two
 * of them compiled: `Tree` was given custom node data flat when it goes in under `data`, and `sort`
 * was left off, so the rows silently alphabetized themselves. Both are called out below because no
 * amount of type checking on the generated source would have caught the second one.
 */
export const RENDERER_CONTRACT = `A field renderer is one TSX file with NO import statements. Everything it may use is already in scope:

- React, and the hooks (useState, useMemo, ...) via React.useState etc.
- observer, from mobx-react-lite. Wrap the component in it, because the field view model is observable.
- createFieldRenderer and createObjectFieldRenderer.
- The admin design system. These are the ONLY components in scope, and these are their real props. They are not consistent with each other, so copy the signature rather than generalising from another one:

    <Input value={string} onChange={value => ...} onBlur={} placeholder={} disabled={} size="md|lg|xl" />
      onChange receives the VALUE, not an event. There is no "sm" size.
    <Text size="sm|md|lg">content goes in children</Text>
      Children only. Text has NO "text" prop, even though Button and FormComponentLabel do.
    <Button text="Save" variant="primary|secondary|ghost" size="sm|md|lg|xl" icon={} onClick={} />
      Children work too, so <Button onClick={}>Save</Button> is fine.
    <Icon icon={<SomeSvg />} size="sm" label="description of the icon" />
      label is REQUIRED.
    <IconButton icon={<Icon ... />} aria-label="Remove" size="sm" variant="ghost" onClick={} />
      aria-label, NOT label.
    <FormComponentLabel text={field.label} required={field.required} disabled={field.disabled} />
    <FormComponentDescription text={field.description} />
    Tree: see the block at the end.

Rules:
- Declare the component as \`const Renderer = ...\`. That exact name is what gets loaded.
- No imports, no fetch, no direct DOM access, no globals beyond the above. Anything else fails to load.
- Use only the components above, with exactly the props above. A wrong prop name does not throw: React drops it and you get a component that renders nothing, which is the most common way these fail.

Working with the field. Every renderer is given { field }:
- Strings you should render: field.label, field.description, field.placeholder. A renderer that drops the label leaves the form unreadable, so render FormComponentLabel unless you are deliberately replacing it.
- Booleans: field.required, field.disabled, field.visible, field.validating.
- field.validation is { isValid: boolean | null, message?: string }. It is the RESULT of validation, a single object. It is NOT a list of validation rules, and iterating it throws.
- The field does not expose its configured validators, so a renderer cannot read a maxLength or similar. If you need a number like that, do not dig for it: it is not there.
- A single-value field: read field.value and write it with field.onChange(newValue). Call field.onBlur() on blur so validation runs when the form expects it.
- An object list field: field.items, field.addItem(), field.moveItem(from, to), and item.remove() per item. Read a child with item.fields.find(f => f.name === "<childName>"), then its .value and .onChange.
- Do not hold the field's data in local state. Call the model and let the observer re-render.
- Styling is yours to choose. className with the admin's utility classes is preferred; an inline style object is fine when there is no class for it.

Tree, for drag-and-drop ordering. It wraps @minoru/react-dnd-treeview but does NOT take that library's props. Use exactly these:

  <Tree
    nodes={nodes}          // NOT "tree"
    rootId={"root"}        // ids and parentIds are STRINGS, not numbers
    renderer={node => ...} // NOT "render"
    sort={false}
    canDrag={() => true}
    canDrop={(_, options) => options.dropTargetId === "root"}
    onDrop={(newTree, options) => ...}
  />

- sort={false} is required. Without it Tree alphabetizes rows by label, which silently reorders a list whose order IS the data. Nothing throws; the rows just move.
- A node goes IN as { id, label, parentId, droppable, data: { item } } — custom data nested under \`data\`.
- It comes back OUT flat: the renderer callback receives node.item, NOT node.data.item.
- In onDrop, derive the new order from newTree (filter to your rootId, map to ids) rather than from a destination index.

Getting any of this wrong renders an empty Tree rather than an error, so re-read this block before you use it.`;
