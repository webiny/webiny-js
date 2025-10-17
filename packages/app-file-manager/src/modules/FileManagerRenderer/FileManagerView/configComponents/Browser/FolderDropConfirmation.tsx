import React from "react";
import { AcoConfig } from "@webiny/app-aco";

const { Folder } = AcoConfig;

type FolderDropConfirmationProps = React.ComponentProps<typeof AcoConfig.Folder.DropConfirmation>;

export const FolderDropConfirmation = (props: FolderDropConfirmationProps) => {
    return (
        <AcoConfig>
            <Folder.DropConfirmation {...props} />
        </AcoConfig>
    );
};