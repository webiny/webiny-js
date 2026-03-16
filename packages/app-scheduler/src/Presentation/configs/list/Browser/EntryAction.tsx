import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, type RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export type { RecordActionConfig as EntryActionConfig };

type EntryActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BaseEntryAction = (props: EntryActionProps) => {
    return (
        <CompositionScope name={"scheduler"}>
            <Record.Action {...props} />
        </CompositionScope>
    );
};

export const EntryAction = Object.assign(BaseEntryAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem
});
