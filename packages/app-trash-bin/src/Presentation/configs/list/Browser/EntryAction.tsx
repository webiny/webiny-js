import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export type { RecordActionConfig as EntryActionConfig };

type EntryActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BaseEntryAction = (props: EntryActionProps) => {
    return (
        <CompositionScope name={"trash"}>
            <AcoConfig>
                <Record.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const EntryAction = Object.assign(BaseEntryAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem
});
