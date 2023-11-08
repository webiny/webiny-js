import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoListConfig, FolderActionConfig } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";

const { Folder } = AcoListConfig;

export { FolderActionConfig };

export interface FolderActionProps
    extends React.ComponentProps<typeof AcoListConfig.Folder.Action> {
    modelIds?: string[];
}

export const FolderAction: React.FC<FolderActionProps> = ({ modelIds = [], ...props }) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return (
        <CompositionScope name={"cms"}>
            <AcoListConfig>
                <Folder.Action {...props} />
            </AcoListConfig>
        </CompositionScope>
    );
};
