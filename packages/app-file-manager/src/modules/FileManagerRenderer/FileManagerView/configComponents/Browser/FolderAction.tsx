import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, FolderActionConfig } from "@webiny/app-aco";

const { Folder } = AcoConfig;

export { FolderActionConfig };

export const FolderAction: React.FC<
    React.ComponentProps<typeof AcoConfig.Folder.Action>
> = props => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Folder.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
