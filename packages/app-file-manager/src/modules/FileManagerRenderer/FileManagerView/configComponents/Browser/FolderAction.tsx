import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, FolderActionConfig } from "@webiny/app-aco";

const { Folder } = AcoConfig;

export { FolderActionConfig };

type FolderActionProps = React.ComponentProps<typeof AcoConfig.Folder.Action>;

export const FolderAction = (props: FolderActionProps) => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Folder.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
