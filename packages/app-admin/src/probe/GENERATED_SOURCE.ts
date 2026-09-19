/**
 * PROBE fixture: the renderer the cold-generation agent produced, reduced to the shape a generator
 * emits — no imports, one component named `Renderer`. Kept as a string because that is how it will
 * arrive: out of a model, into the CMS, never through a build.
 */
export const GENERATED_SOURCE = `
const ROOT_ID = "menu-builder-root";

const getChildField = (item, name) => item.fields.find(f => f.name === name);

const MenuItemRow = observer(({ item, disabled }) => {
    const labelField = getChildField(item, "label");
    const urlField = getChildField(item, "url");

    return (
        <div className={"flex items-center gap-sm w-full"}>
            <div className={"flex-1"}>
                <Input
                    placeholder={"Label"}
                    value={typeof labelField?.value === "string" ? labelField.value : ""}
                    onChange={value => labelField?.onChange(value)}
                    disabled={disabled}
                />
            </div>
            <div className={"flex-1"}>
                <Input
                    placeholder={"URL"}
                    value={typeof urlField?.value === "string" ? urlField.value : ""}
                    onChange={value => urlField?.onChange(value)}
                    disabled={disabled}
                />
            </div>
            <Button text={"Remove"} variant={"ghost"} size={"sm"} onClick={() => item.remove()} />
        </div>
    );
});

const Renderer = createObjectFieldRenderer(({ field }) => {
    if (!field.isList) {
        return null;
    }

    const nodes = field.items.map(item => {
        const labelField = getChildField(item, "label");
        const label =
            typeof labelField?.value === "string" && labelField.value.length > 0
                ? labelField.value
                : "Untitled menu item";

        return { id: item.key, label, parentId: ROOT_ID, droppable: false, data: { item } };
    });

    const handleDrop = (newTree, options) => {
        const { dragSourceId } = options;
        if (!dragSourceId) {
            return;
        }

        const fromIndex = field.items.findIndex(item => item.key === dragSourceId);
        const order = newTree.filter(n => n.parentId === ROOT_ID).map(n => n.id);
        const toIndex = order.indexOf(dragSourceId);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            return;
        }

        field.moveItem(fromIndex, toIndex);
    };

    return (
        <div className={"flex flex-col gap-md"}>
            {nodes.length > 0 ? (
                <Tree
                    rootId={ROOT_ID}
                    nodes={nodes}
                    sort={false}
                    canDrag={() => !field.disabled}
                    canDrop={(_, options) => options.dropTargetId === ROOT_ID}
                    onDrop={handleDrop}
                    renderer={node => <MenuItemRow item={node.item} disabled={field.disabled} />}
                />
            ) : (
                <Text size={"sm"}>No menu items yet.</Text>
            )}

            <div>
                <Button
                    text={"Add menu item"}
                    variant={"secondary"}
                    size={"sm"}
                    onClick={() => field.addItem()}
                />
            </div>
        </div>
    );
});
`;
