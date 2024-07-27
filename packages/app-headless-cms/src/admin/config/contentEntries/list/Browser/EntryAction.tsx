import React from "react";
import { CompositionScope, makeDecoratable } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";
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
            <CompositionScope name={"cms"}>
                <AcoConfig>
                    <IsApplicableToCurrentModel modelIds={modelIds}>
                        <Record.Action {...props} />
                    </IsApplicableToCurrentModel>
                </AcoConfig>
            </CompositionScope>
        );
    }
);

export const EntryAction = Object.assign(BaseEntryAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
