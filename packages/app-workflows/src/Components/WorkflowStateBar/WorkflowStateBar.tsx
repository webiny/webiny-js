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
import { WorkflowStateBarStartReview } from "./Bars/WorkflowStateBarStartReview.js";
import { WorkflowStateBarCancelReview } from "./Bars/WorkflowStateBarCancelReview.js";
import { WorkflowStateBarReview } from "./Bars/WorkflowStateBarReview.js";
import { WorkflowStateBarApproved } from "./Bars/WorkflowStateBarApproved.js";
import { WorkflowStateBarRejected } from "./Bars/WorkflowStateBarRejected.js";
import { WorkflowStateBarWorkflow } from "./Bars/WorkflowStateBarWorkflow.js";
import { WorkflowStateBarComponent } from "./WorkflowStateBarComponent.js";

export interface IWorkflowStateBarProps {
    id: string;
    app: string;
    identity: IIdentity;
    client: ApolloClient<object>;
}

interface IWorkflowStateBarWithPresenterProps {
    presenter: IWorkflowStatePresenter;
}

const WorkflowStateBarWithPresenter = observer((props: IWorkflowStateBarWithPresenterProps) => {
    const { presenter } = props;
    if (!presenter.vm.workflow) {
        return null;
    }
    return (
        <>
            <Plugins>
                <WorkflowStateBarApproved />
                <WorkflowStateBarRejected />
                <WorkflowStateBarReview />
                <WorkflowStateBarStartReview />
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
        const presenter = new WorkflowStatePresenter({
            app,
            targetRevisionId: id,
            identity,
            repository,
            workflowsRepository
        });
        presenter.init();
        return presenter;
    }, [app, id, identity, client]);

    return <WorkflowStateBarWithPresenter presenter={presenter} />;
};
