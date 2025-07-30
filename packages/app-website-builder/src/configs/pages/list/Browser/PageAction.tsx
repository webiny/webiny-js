import React from "react";
import { AcoConfig, type RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export type { RecordActionConfig as PageActionConfig };

type PageActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BasePageAction = (props: PageActionProps) => {
    return (
        <AcoConfig>
            <Record.Action {...props} />
        </AcoConfig>
    );
};

export const PageAction = Object.assign(BasePageAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
