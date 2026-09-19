import React from "react";
import { Button, Icon, IconButton, Input, Text, Tree } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import type { IObjectFieldItemVM } from "~/features/formModel/abstractions.js";

/**
 * PROBE, not shipping code. Answers one question: can a non-trivial custom field renderer be built
 * from React plus what the admin already loads, with no dependency the generated code brings itself?
 *
 * The answer is yes, and by a wider margin than expected — see the notes at the bottom of the file.
 */

const ROOT = "__root__";

const childValue = (item: IObjectFieldItemVM, name: string): string => {
    const field = item.fields.find(f => f.name === name);
    return typeof field?.value === "string" ? field.value : "";
};

const setChildValue = (item: IObjectFieldItemVM, name: string, value: string): void => {
    item.fields.find(f => f.name === name)?.onChange(value);
};

export const MenuBuilderFieldRenderer = createObjectFieldRenderer(({ field }) => {
    if (!field.isList) {
        return <Text size={"sm"}>The menu builder expects a list of items.</Text>;
    }

    /*
     * `Tree` wants a flat node list with `parentId`, which is the same shape the form model already
     * holds: one node per list item, all under a synthetic root. Nesting would be a `parentId` child
     * field on the item; flat is enough to answer the dependency question.
     */
    const nodes = field.items.map((item, index) => ({
        id: String(index),
        parentId: ROOT,
        label: childValue(item, "label") || "Untitled",
        droppable: true,
        data: { item, index }
    }));

    return (
        <div className={"flex flex-col gap-sm"}>
            <Tree
                nodes={nodes}
                rootId={ROOT}
                onDrop={(_newTree, { dragSourceId, dropTargetId }) => {
                    /*
                     * The reorder itself is the form model's job, not the renderer's. `moveItem`
                     * already exists on the object field and persists through the same path a
                     * keyboard reorder would, so drag is only an input method here.
                     */
                    const from = Number(dragSourceId);
                    const to =
                        dropTargetId === ROOT ? field.items.length - 1 : Number(dropTargetId);

                    if (!Number.isNaN(from) && !Number.isNaN(to) && from !== to) {
                        field.moveItem(from, to);
                    }
                }}
                renderer={node => {
                    // `WithDefaultNodeData` FLATTENS `data` onto the node rather than nesting it.
                    const { item, index } = node as unknown as {
                        item: IObjectFieldItemVM;
                        index: number;
                    };

                    return (
                        <div className={"flex flex-1 items-center gap-sm py-xxs"}>
                            <Input
                                size={"md"}
                                placeholder={"Label"}
                                value={childValue(item, "label")}
                                onChange={value => setChildValue(item, "label", value)}
                            />
                            <Input
                                size={"md"}
                                placeholder={"URL"}
                                value={childValue(item, "url")}
                                onChange={value => setChildValue(item, "url", value)}
                            />
                            <IconButton
                                size={"sm"}
                                variant={"ghost"}
                                icon={<Icon icon={<DeleteIcon />} size={"sm"} label={"Remove"} />}
                                aria-label={`Remove item ${index + 1}`}
                                onClick={() => item.remove()}
                            />
                        </div>
                    );
                }}
            />

            <div>
                <Button
                    variant={"secondary"}
                    size={"sm"}
                    text={"Add item"}
                    icon={<Icon icon={<AddIcon />} size={"sm"} label={""} />}
                    onClick={() => field.addItem()}
                />
            </div>
        </div>
    );
});

/**
 * What the probe found.
 *
 * 1. No new dependency is needed, and not even the drag library. `admin-ui` exports `Tree`, which
 *    wraps `@minoru/react-dnd-treeview` and already does drag, drop, nesting and collapse. Tier 1
 *    was framed as "React + admin-ui + the host's pragmatic-drag-and-drop"; the host is one level
 *    more capable than that.
 *
 * 2. The hard half is not in the renderer. `IObjectFieldVM` already exposes `items`, `addItem`,
 *    `moveItem`, `duplicateItem` and per-item `remove`, so reorder-with-persistence is a call, not
 *    an implementation. A generated renderer supplies presentation and calls the model.
 *
 * 3. What a generator would need told, beyond the prompt: that the field is a LIST of objects, and
 *    the child field names (`label`, `url`). Both are already in the CMS model, which is exactly
 *    what `describeContentModel` returns to the assistant today.
 *
 * 4. Naming the libraries is not enough. Four of the first draft's lines failed to compile, and all
 *    four were plausible guesses at an API rather than nonsense: `Input` has no `sm` size, only
 *    `md`/`lg`/`xl`; `IconButton` takes `aria-label`, not `label`; and `Tree`'s renderer receives a
 *    node with `data` FLATTENED onto it, not nested. A generator needs the type surface, or a
 *    compile-and-retry loop, or it will produce exactly these near-misses.
 *
 * Unanswered, and the real risk: this is hand-written. It proves the ceiling is high enough, not
 * that a model reaches it. The next step is generating this same file from a prompt and diffing.
 *
 * ---
 *
 * Answered, by generating it cold and then running it in a browser (`GENERATED_SOURCE.ts`).
 *
 * 5. A model reaches the ceiling, but not on the first try, and compiling is not the bar. The cold
 *    draft had one compile error; it had TWO more bugs that compile fine and only appear once the
 *    thing is on screen with data in it:
 *
 *      - It passed custom node data FLAT to `Tree` and read it back flat. Only the read side is
 *        flat. `NodeDto.data` goes in nested, `WithDefaultNodeData<T>` comes back merged. Both the
 *        cold draft and this hand-written file got that asymmetry wrong, in opposite halves.
 *      - It never passed `sort`, so `Tree` fell through to react-dnd-treeview's default and
 *        alphabetized the rows by label. A menu builder whose entire feature is drag-to-reorder
 *        silently reordered itself the moment a user typed a label. Nothing throws; the form data
 *        stays correct; only the screen disagrees with it.
 *
 * 6. So a compile-and-retry loop is necessary and not sufficient. The `sort` bug survives any
 *    amount of type checking, and a generator has no way to know the default is "sorted" unless it
 *    is told. Whatever ships needs either a render-and-check step, or `Tree`'s defaults documented
 *    in whatever type surface the generator is handed.
 *
 * 7. The mechanism is fine. Generated string -> esbuild-wasm in the browser -> `new Function` with
 *    the admin's own React and design system injected -> a working renderer bound to a real
 *    `FormModel`, no build step and no page reload. The per-item error boundary in `FormView` also
 *    contained both failures above rather than blanking the page, which is what makes iterating on
 *    generated code survivable.
 */
