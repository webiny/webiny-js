import React from "react";
import { AcoConfig, type FolderActionConfig } from "@webiny/app-aco";
import { useModel } from "~/admin/hooks";

const { Folder } = AcoConfig;

export type { FolderActionConfig };

export interface FolderActionProps extends React.ComponentProps<typeof AcoConfig.Folder.Action> {
    modelIds?: string[];
}

const BaseFolderAction = ({ modelIds = [], ...props }: FolderActionProps) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return (
        <AcoConfig>
            <Folder.Action {...props} />
        </AcoConfig>
    );
};

export const FolderAction = Object.assign(BaseFolderAction, {
    OptionsMenuItem: Folder.Action.OptionsMenuItem
});
