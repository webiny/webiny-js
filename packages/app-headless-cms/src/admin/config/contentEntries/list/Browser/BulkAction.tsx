import React, { useMemo } from "react";
import { useButtons, useDialogWithReport, Worker } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useContentEntriesList, useModel } from "~/admin/hooks";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

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
    element: React.ReactElement;
}

export const BaseBulkAction: React.FC<BulkActionProps> = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    modelIds = [],
    element
}) => {
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
                <Property id={getId(name, "element")} name={"element"} value={element} />
            </Property>
        </Property>
    );
};

const useWorker = () => {
    const { selected } = useContentEntriesList();
    return useMemo(() => new Worker<CmsContentEntry>(selected), [selected]);
};

export const BulkAction = Object.assign(BaseBulkAction, {
    useButtons,
    useWorker,
    useDialog: useDialogWithReport
});
