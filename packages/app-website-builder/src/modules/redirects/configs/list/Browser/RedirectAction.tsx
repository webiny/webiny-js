import React from "react";
import { AcoConfig, type RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export type { RecordActionConfig };

type RedirectActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BaseRedirectAction = (props: RedirectActionProps) => {
    return (
        <AcoConfig priority={"secondary"}>
            <Record.Action {...props} />
        </AcoConfig>
    );
};

export const RedirectAction = Object.assign(BaseRedirectAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
