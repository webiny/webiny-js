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
- The admin design system, in scope by name: Button, Icon, IconButton, Input, Text, Tree, FormComponentLabel, FormComponentDescription.

Rules:
- Declare the component as \`const Renderer = ...\`. That exact name is what gets loaded.
- No imports, no fetch, no direct DOM access, no globals beyond the above. Anything else fails to load.
- Use only components from the list. Do not invent props: Input sizes are md/lg/xl (there is no sm), and IconButton takes aria-label, not label.

Working with the field:
- An object list field gives you field.items, field.addItem(), field.moveItem(from, to), and item.remove().
- Read a child field with item.fields.find(f => f.name === "<childName>"), then its .value and .onChange.
- Do not hold the field's data in local state. Call the model and let the observer re-render.

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
