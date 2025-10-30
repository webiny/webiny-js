import React from "react";
import type { IIdentity, IWorkflowStatesWidgetItem } from "~/types.js";
import { TimeAgo } from "@webiny/admin-ui";

interface IWorkflowStateRowDescriptionProps {
    state: IWorkflowStatesWidgetItem;
}

interface IIdentityProps {
    identity: IIdentity | undefined | null;
}

const Identity = ({ identity }: IIdentityProps) => {
    if (!identity) {
        return null;
    }
    return <> - {identity.displayName || identity.id}</>;
};

export const WorkflowStateRowDescription = (props: IWorkflowStateRowDescriptionProps) => {
    const { state } = props;
    return (
        <>
            {state.step.title}
            <Identity identity={state.step.savedBy} />
            , <TimeAgo datetime={state.savedOn} />
        </>
    );
};
