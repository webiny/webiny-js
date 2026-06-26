import React from "react";
import type { IIdentity, IWorkflowState } from "~/types.js";
import { TimeAgo } from "@webiny/admin-ui";

interface IWorkflowStateRowDescriptionProps {
    state: IWorkflowState;
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
            {state.currentStep.title}
            <Identity identity={state.currentStep.savedBy} />, <TimeAgo datetime={state.savedOn} />
        </>
    );
};
