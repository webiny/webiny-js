import React from "react";
import { AcoConfig, FolderActionConfig } from "@webiny/app-aco";

const { Folder } = AcoConfig;

export { FolderActionConfig };

type FolderActionProps = React.ComponentProps<typeof AcoConfig.Folder.Action>;

const BaseFolderAction = (props: FolderActionProps) => {
    return (
        <AcoConfig>
            <Folder.Action {...props} />
        </AcoConfig>
    );
};

export const FolderAction = Object.assign(BaseFolderAction, {
    OptionsMenuItem: Folder.Action.OptionsMenuItem
});
