import React from "react";
import { AcoConfig, type RecordActionConfig } from "@webiny/app-aco";
import { makeDecoratable } from "@webiny/react-composition";

const { Record } = AcoConfig;

export type { RecordActionConfig as PageActionConfig };

type PageActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BasePageAction = makeDecoratable("PageAction", (props: PageActionProps) => {
    return <Record.Action {...props} />;
});

export const PageAction = Object.assign(BasePageAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
