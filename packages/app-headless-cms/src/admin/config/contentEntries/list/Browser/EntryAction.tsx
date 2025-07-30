import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { AcoConfig, type RecordActionConfig } from "@webiny/app-aco";
import { IsApplicableToCurrentModel } from "~/admin/config/IsApplicableToCurrentModel";

const { Record } = AcoConfig;

export type { RecordActionConfig as EntryActionConfig };

export interface EntryActionProps extends React.ComponentProps<typeof AcoConfig.Record.Action> {
    modelIds?: string[];
}

const BaseEntryAction = makeDecoratable(
    "EntryAction",
    ({ modelIds = [], ...props }: EntryActionProps) => {
        return (
            <AcoConfig>
                <IsApplicableToCurrentModel modelIds={modelIds}>
                    <Record.Action {...props} />
                </IsApplicableToCurrentModel>
            </AcoConfig>
        );
    }
);

export const EntryAction = Object.assign(BaseEntryAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
