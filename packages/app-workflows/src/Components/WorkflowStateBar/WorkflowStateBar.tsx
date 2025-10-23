import React, { useMemo } from "react";
import type ApolloClient from "apollo-client";
import { observer } from "mobx-react-lite";
import type { IIdentity } from "~/types.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { WorkflowStatePresenter } from "~/Presenters/index.js";
import { WorkflowsRepository, WorkflowStateRepository } from "~/Repositories/index.js";
import { WorkflowsGateway, WorkflowStateGateway } from "~/Gateways/index.js";
import { Plugins } from "@webiny/app";
import { WorkflowStateBarError } from "./Bars/WorkflowStateBarError.js";
import { WorkflowStateBarLoading } from "./Bars/WorkflowStateBarLoading.js";
import { WorkflowStateBarRequestReview } from "./Bars/WorkflowStateBarRequestReview.js";
import { WorkflowStateBarCancelReview } from "./Bars/WorkflowStateBarCancelReview.js";
import { WorkflowStateBarReview } from "./Bars/WorkflowStateBarReview.js";
import { WorkflowStateBarApproved } from "./Bars/WorkflowStateBarApproved.js";
import { WorkflowStateBarRejected } from "./Bars/WorkflowStateBarRejected.js";
import { WorkflowStateBarWorkflow } from "./Bars/WorkflowStateBarWorkflow.js";
import { WorkflowStateBarComponent } from "./WorkflowStateBarComponent.js";
import { ApproveDialog } from "./Bars/dialogs/ApproveDialog.js";
import { ApproveSuccessDialog } from "./Bars/dialogs/ApproveSuccessDialog.js";
import { RejectDialog } from "./Bars/dialogs/RejectDialog.js";
import { RejectSuccessDialog } from "./Bars/dialogs/RejectSuccessDialog.js";
import { CommentDialog } from "./Bars/dialogs/CommentDialog.js";

export interface IWorkflowStateBarProps {
    id: string;
    app: string;
    identity: IIdentity;
    client: ApolloClient<object>;
}

interface IWorkflowStateBarWithPresenterProps {
    presenter: IWorkflowStatePresenter;
}

const WorkflowStateBarObserver = observer((props: IWorkflowStateBarWithPresenterProps) => {
    const { presenter } = props;
    /**
     * If no workflow, do not show anything - there might not be a workflow assigned.
     * We do not want to show loading or error states in this case.
     */
    if (!presenter.vm.workflow) {
        return null;
    }
    return (
        <>
            {presenter.vm.showApproveDialog ? <ApproveDialog presenter={presenter} /> : null}
            {presenter.vm.showApproveSuccessDialog ? (
                <ApproveSuccessDialog presenter={presenter} />
            ) : null}
            {presenter.vm.showRejectDialog ? <RejectDialog presenter={presenter} /> : null}
            {presenter.vm.showRejectSuccessDialog ? (
                <RejectSuccessDialog presenter={presenter} />
            ) : null}
            {presenter.vm.showStepCommentDialog ? (
                <CommentDialog presenter={presenter} step={presenter.vm.showStepCommentDialog} />
            ) : null}
            <Plugins>
                <WorkflowStateBarApproved />
                <WorkflowStateBarRejected />
                <WorkflowStateBarReview />
                <WorkflowStateBarCancelReview />
                <WorkflowStateBarRequestReview />
                <WorkflowStateBarLoading />
                <WorkflowStateBarWorkflow />
                <WorkflowStateBarError />
            </Plugins>
            <WorkflowStateBarComponent {...props} />
        </>
    );
});

export const WorkflowStateBar = (props: IWorkflowStateBarProps) => {
    const { id, app, identity, client } = props;

    const presenter = useMemo(() => {
        const gateway = new WorkflowStateGateway({
            client
        });
        const repository = new WorkflowStateRepository({
            gateway
        });
        const workflowsGateway = new WorkflowsGateway({
            client
        });
        const workflowsRepository = new WorkflowsRepository({
            gateway: workflowsGateway
        });
        return new WorkflowStatePresenter({
            app,
            targetRevisionId: id,
            identity,
            repository,
            workflowsRepository
        });
    }, [app, id, identity, client]);

    return <WorkflowStateBarObserver presenter={presenter} />;
};
