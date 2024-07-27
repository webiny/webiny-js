import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export type { RecordActionConfig as FileActionConfig };

type FileActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BaseFileAction = (props: FileActionProps) => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Record.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const FileAction = Object.assign(BaseFileAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
