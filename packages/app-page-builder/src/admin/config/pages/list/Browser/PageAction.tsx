import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, RecordActionConfig } from "@webiny/app-aco";

const { Record } = AcoConfig;

export { RecordActionConfig as PageActionConfig };

type PageActionProps = React.ComponentProps<typeof AcoConfig.Record.Action>;

export const PageAction = (props: PageActionProps) => {
    return (
        <CompositionScope name={"pb.page"}>
            <AcoConfig>
                <Record.Action {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
