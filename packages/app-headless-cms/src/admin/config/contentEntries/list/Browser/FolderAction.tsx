import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, FolderActionConfig } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";

const { Folder } = AcoConfig;

export { FolderActionConfig };

export interface FolderActionProps extends React.ComponentProps<typeof AcoConfig.Folder.Action> {
    modelIds?: string[];
}

const BaseFolderAction = ({ modelIds = [], ...props }: FolderActionProps) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return (
        <CompositionScope name={"cms"}>
            <AcoConfig>
                <Folder.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const FolderAction = Object.assign(BaseFolderAction, {
    OptionsMenuItem: Folder.Action.OptionsMenuItem
});
