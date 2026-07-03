import React from "react";
import { AcoConfig, type FolderActionConfig } from "@webiny/app-aco";

const { Folder } = AcoConfig;

export type { FolderActionConfig };

type FolderActionProps = React.ComponentProps<typeof AcoConfig.Folder.Action>;

const BaseFolderAction = (props: FolderActionProps) => {
    return <Folder.Action {...props} />;
};

export const FolderAction = Object.assign(BaseFolderAction, {
    OptionsMenuItem: Folder.Action.OptionsMenuItem
});
