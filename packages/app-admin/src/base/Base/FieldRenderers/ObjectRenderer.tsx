import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, IconButton } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import type { IFieldVM, IObjectFieldVM, IObjectFieldItemVM } from "~/features/formModel/index.js";
import { useFormViewRenderers } from "~/features/formModel/FormView.js";

const isObjectFieldVM = (field: IFieldVM): field is IObjectFieldVM => {
    return field.type === "object";
};

export const ObjectRenderer = observer(function ObjectRenderer({ field }: { field: IFieldVM }) {
    if (!isObjectFieldVM(field)) {
        return null;
    }

    if (field.isList) {
        return <ListObjectRenderer field={field} />;
    }

    return <SingleObjectRenderer field={field} />;
});

const SingleObjectRenderer = observer(function SingleObjectRenderer({
    field
}: {
    field: IObjectFieldVM;
}) {
    return (
        <Accordion background={"base"} variant={"container"}>
            <Accordion.Item title={field.label} defaultOpen={true}>
                <ChildFields fields={field.fields} />
            </Accordion.Item>
        </Accordion>
    );
});

const ListObjectRenderer = observer(function ListObjectRenderer({
    field
}: {
    field: IObjectFieldVM;
}) {
    const label = `${field.label || ""} ${field.items.length ? `(${field.items.length})` : ""}`;

    return (
        <div className={"flex flex-col gap-sm"}>
            <Accordion background={"base"} variant={"container"}>
                <Accordion.Item title={label} defaultOpen={true}>
                    <div className={"flex flex-col gap-sm"}>
                        {field.items.map((item, index) => (
                            <ListItemRenderer
                                key={item.key}
                                item={item}
                                index={index}
                                total={field.items.length}
                                disabled={field.disabled}
                            />
                        ))}
                    </div>
                </Accordion.Item>
            </Accordion>
            <div>
                <Button
                    text={`Add ${field.label || "Item"}`}
                    variant={"secondary"}
                    size={"sm"}
                    onClick={() => field.addItem()}
                    disabled={field.disabled}
                />
            </div>
        </div>
    );
});

interface ListItemRendererProps {
    item: IObjectFieldItemVM;
    index: number;
    total: number;
    disabled: boolean;
}

const ListItemRenderer = observer(function ListItemRenderer({
    item,
    index,
    total,
    disabled
}: ListItemRendererProps) {
    const actions = (
        <>
            <IconButton
                icon={<ArrowDown />}
                onClick={e => {
                    e.stopPropagation();
                    item.moveDown();
                }}
                variant="ghost"
                disabled={index === total - 1}
            />
            <IconButton
                icon={<ArrowUp />}
                onClick={e => {
                    e.stopPropagation();
                    item.moveUp();
                }}
                variant="ghost"
                disabled={index === 0}
            />
            <Accordion.Item.Action.Separator />
            <IconButton
                icon={<DeleteIcon />}
                onClick={e => {
                    e.stopPropagation();
                    item.remove();
                }}
                variant="ghost"
            />
        </>
    );

    return (
        <Accordion background={"base"} variant={"container"} openClosedIndicatorPosition={"left"}>
            <Accordion.Item
                title={item.title}
                actions={disabled ? null : actions}
                defaultOpen={true}
            >
                <ChildFields fields={item.fields} />
            </Accordion.Item>
        </Accordion>
    );
});

const ChildFields = observer(function ChildFields({ fields }: { fields: IFieldVM[] }) {
    const { fieldRenderers } = useFormViewRenderers();

    return (
        <div className={"flex flex-col gap-4 p-sm"}>
            {fields.map(childField => {
                const Renderer = childField.renderer
                    ? fieldRenderers[childField.renderer]
                    : undefined;

                if (!Renderer) {
                    return null;
                }

                return <Renderer key={childField.name} field={childField} />;
            })}
        </div>
    );
});
