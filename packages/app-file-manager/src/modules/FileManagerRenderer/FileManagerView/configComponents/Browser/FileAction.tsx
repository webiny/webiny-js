import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export { RecordActionConfig as FileActionConfig };

export const FileAction: React.FC<React.ComponentProps<typeof AcoConfig.Record.Action>> = props => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Record.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
