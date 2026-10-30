import React from "react";
import { Alert } from "@webiny/admin-ui";
import { ReactComponent as UpdateIcon } from "@webiny/icons/update.svg";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRoutingMessages.js";

export interface TestRoutingStaleProps {
    canRun: boolean;
    onRetest(): void;
}

// A shown result no longer matches the configuration or the inputs (R300); it is never re-run by itself.
export const TestRoutingStale = (props: TestRoutingStaleProps) => {
    return (
        <Alert
            type={"warning"}
            variant={"subtle"}
            icon={<UpdateIcon />}
            actions={
                <Alert.Action
                    text={TEST_ROUTING_TAB_MESSAGES.testAgain}
                    disabled={!props.canRun}
                    onClick={props.onRetest}
                />
            }
        >
            {TEST_ROUTING_TAB_MESSAGES.stale}
        </Alert>
    );
};
