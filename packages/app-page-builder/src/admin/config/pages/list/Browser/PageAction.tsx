import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export { RecordActionConfig as PageActionConfig };

type PageActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

const BasePageAction = (props: PageActionProps) => {
    return (
        <CompositionScope name={"pb.page"}>
            <AcoConfig>
                <Record.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const PageAction = Object.assign(BasePageAction, {
    OptionsMenuItem: Record.Action.OptionsMenuItem,
    OptionsMenuLink: Record.Action.OptionsMenuLink
});
