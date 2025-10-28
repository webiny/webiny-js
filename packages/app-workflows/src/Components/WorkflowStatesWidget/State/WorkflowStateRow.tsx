import React from "react";
import type { IIdentity, IWorkflowStatesWidgetItem } from "~/types.js";
import { Accordion, TimeAgo } from "@webiny/admin-ui";
import { Color } from "~/Components/Workflows/Step/Color.js";
import { observer } from "mobx-react-lite";
import { WorkflowStateRowOptions } from "./WorkflowStateRowOptions.js";

interface IWorkflowStateRowProps {
    state: IWorkflowStatesWidgetItem;
}

interface IIdentityProps {
    identity: IIdentity | undefined | null;
}

const Identity = ({ identity }: IIdentityProps) => {
    if (!identity) {
        return null;
    }
    return <>- {identity.displayName || identity.id}</>;
};

export const WorkflowStateRow = observer((props: IWorkflowStateRowProps) => {
    const { state } = props;

    return (
        <Accordion.Item
            title={state.title}
            open={false}
            interactive={false}
            description={
                <>
                    {state.step.title}
                    <Identity identity={state.step.savedBy} />
                    , <TimeAgo datetime={state.savedOn} />
                </>
            }
            icon={<Color color={state.step.color} />}
            actions={<WorkflowStateRowOptions state={state} />}
        >
            <></>
        </Accordion.Item>
    );
});
