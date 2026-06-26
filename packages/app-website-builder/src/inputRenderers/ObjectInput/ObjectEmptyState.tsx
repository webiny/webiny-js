import React from "react";
import { Button, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface ObjectEmptyStateProps {
    text?: string;
    addText?: string;
    onAdd: () => void;
}

/**
 * The empty placeholder shown when a list object field has no items yet.
 */
export const ObjectEmptyState = ({
    text = "Add your first item here",
    addText = "Add",
    onAdd
}: ObjectEmptyStateProps) => {
    return (
        <div
            className={
                "flex flex-col items-center justify-center gap-sm rounded-md border border-dashed border-neutral-dimmed px-sm py-lg"
            }
        >
            <Text size={"sm"} className={"text-neutral-strong"}>
                {text}
            </Text>
            <Button
                variant={"secondary"}
                size={"sm"}
                icon={<AddIcon />}
                text={addText}
                onClick={onAdd}
            />
        </div>
    );
};
