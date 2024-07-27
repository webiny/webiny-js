import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, FolderActionConfig } from "@webiny/app-aco";

const { Folder } = AcoConfig;

export type { FolderActionConfig };

type FolderActionProps = React.ComponentProps<typeof AcoConfig.Folder.Action>;

const BaseFolderAction = (props: FolderActionProps) => {
    return (
        <CompositionScope name={"pb.page"}>
            <AcoConfig>
                <Folder.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const FolderAction = Object.assign(BaseFolderAction, {
    OptionsMenuItem: Folder.Action.OptionsMenuItem
});
