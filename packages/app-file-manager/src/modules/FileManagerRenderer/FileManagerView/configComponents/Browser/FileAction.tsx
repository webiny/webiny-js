import React from "react";
import { AcoConfig, type RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export type { RecordActionConfig as FileActionConfig };

type FileActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BaseFileAction = (props: FileActionProps) => {
    return (
        <AcoConfig>
            <Record.Action {...props} />
        </AcoConfig>
    );
};

export const FileAction = Object.assign(BaseFileAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
