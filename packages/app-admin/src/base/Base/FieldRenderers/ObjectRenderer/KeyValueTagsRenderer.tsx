import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { Button, FormComponentDescription, FormComponentLabel, IconButton } from "@webiny/admin-ui";
import type { IFieldVM, IObjectFieldVM, IObjectFieldItemVM } from "~/features/formModel/index.js";
import { isObjectFieldVM, NestedLayout } from "./ObjectFieldComponents.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        keyValueTags: {
            fieldType: "object";
            settings?: { addItemLabel?: string };
        };
    }
}

export const KeyValueTagsRenderer = observer(({ field }: { field: IFieldVM }) => {
    if (!isObjectFieldVM(field) || !field.isList) {
        return null;
    }

    return <KeyValueTagsList field={field} />;
});

const KeyValueTagsList = observer(({ field }: { field: IObjectFieldVM }) => {
    const settings = field.rendererSettings as { addItemLabel?: string } | undefined;

    const hasItems = field.items.length > 0;

    return (
        <>
            {field.label && <FormComponentLabel text={field.label} />}
            {field.description && <FormComponentDescription text={field.description} />}
            {hasItems ? (
                <div className={"flex flex-col gap-md"}>
                    {field.items.map(item => (
                        <TagRow key={item.key} item={item} disabled={field.disabled} />
                    ))}
                </div>
            ) : null}
            {!field.disabled && (
                <div className={"mt-md"}>
                    <Button
                        onClick={() => field.addItem()}
                        text={settings?.addItemLabel ?? "Add tag"}
                        variant={"secondary"}
                        size={"sm"}
                        icon={<AddIcon />}
                    />
                </div>
            )}
        </>
    );
});

const TagRow = observer(({ item, disabled }: { item: IObjectFieldItemVM; disabled: boolean }) => {
    const inlineLayout = [{ type: "row" as const, fields: item.fields }];

    return (
        <div className={"flex items-center gap-sm"}>
            <div className={"flex-1 gap-md"}>
                <NestedLayout layout={inlineLayout} />
            </div>
            {!disabled && (
                <IconButton
                    variant={"ghost"}
                    size={"lg"}
                    icon={<DeleteIcon />}
                    onClick={() => item.remove()}
                />
            )}
        </div>
    );
});
