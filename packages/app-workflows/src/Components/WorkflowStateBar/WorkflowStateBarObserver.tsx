import React from "react";
import { observer } from "mobx-react-lite";
import type { IWorkflowStateBarComponentProps } from "./WorkflowStateBarComponent.js";
import { WorkflowStateBarComponent } from "./WorkflowStateBarComponent.js";


export const WorkflowStateBarObserver = observer((props: IWorkflowStateBarComponentProps) => {
    return <WorkflowStateBarComponent {...props} />;
    // const { presenter } = props;
    // const { error, state, loading } = presenter.vm;
    //
    // if (state === undefined) {
    //     return <Alert>Loading state...</Alert>;
    // } else if (error) {
    //     return <WorkflowStateBarError error={error} />;
    // } else if (state == null) {
    //     return (
    //         <WorkflowStateBarRequestReview
    //             requestReview={presenter.requestReview}
    //             loading={loading}
    //         />
    //     );
    // }
    //
    // return <Alert>testing</Alert>;
});
