import React from "react";
import { AcoConfig } from "@webiny/app-aco";
import { useModel } from "~/admin/components/ModelProvider/index.js";

const { Folder } = AcoConfig;

export interface FolderDropConfirmationProps extends React.ComponentProps<
    typeof AcoConfig.Folder.DropConfirmation
> {
    modelIds?: string[];
}

export const FolderDropConfirmation = ({
    modelIds = [],
    ...props
}: FolderDropConfirmationProps) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return <Folder.DropConfirmation {...props} />;
};
