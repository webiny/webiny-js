import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export { RecordActionConfig as FileActionConfig };

type FileActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

export const FileAction = (props: FileActionProps) => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Record.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
