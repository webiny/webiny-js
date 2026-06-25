import React from "react";
import { makeDecoratable, useButtons, useDialogWithReport } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useModel } from "~/admin/hooks/index.js";

export interface BulkActionConfig {
    name: string;
    element: React.ReactElement;
}

export interface BulkActionProps {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
    modelIds?: string[];
    element?: React.ReactElement;
}

export const BaseBulkAction = makeDecoratable(
    "BulkAction",
    ({
        name,
        after = undefined,
        before = undefined,
        remove = false,
        modelIds = [],
        element
    }: BulkActionProps) => {
        const { model } = useModel();
        const getId = useIdGenerator("bulkAction");

        if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
            return null;
        }

        const placeAfter = after !== undefined ? getId(after) : undefined;
        const placeBefore = before !== undefined ? getId(before) : undefined;

        return (
            <Property id="browser" name={"browser"}>
                <Property
                    id={getId(name)}
                    name={"bulkActions"}
                    remove={remove}
                    array={true}
                    before={placeBefore}
                    after={placeAfter}
                >
                    <Property id={getId(name, "name")} name={"name"} value={name} />
                    {element ? (
                        <Property id={getId(name, "element")} name={"element"} value={element} />
                    ) : null}
                </Property>
            </Property>
        );
    }
);

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useDialog: useDialogWithReport
});
