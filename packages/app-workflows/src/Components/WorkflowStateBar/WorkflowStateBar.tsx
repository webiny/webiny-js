import React, { useMemo } from "react";
import type { IIdentity } from "~/types.js";
import type ApolloClient from "apollo-client";
import { WorkflowStatePresenter } from "~/Presenters/index.js";
import { WorkflowStateRepository } from "~/Repositories/index.js";
import { WorkflowStateGateway } from "~/Gateways/index.js";
import { WorkflowStateBarObserver } from "./WorkflowStateBarObserver.js";
import { Plugins } from "@webiny/app";
import { WorkflowStateBarError } from "./Bars/WorkflowStateBarError.js";
import { WorkflowStateBarLoading } from "./Bars/WorkflowStateBarLoading.js";
import { WorkflowStateBarRequestReview } from "./Bars/WorkflowStateBarRequestReview.js";
import { WorkflowStateBarStartReview } from "./Bars/WorkflowStateBarStartReview.js";
import { WorkflowStateBarCancelReview } from "./Bars/WorkflowStateBarCancelReview.js";
import { WorkflowStateBarReview } from "./Bars/WorkflowStateBarReview.js";
import { WorkflowStateBarApproved } from "./Bars/WorkflowStateBarApproved.js";
import { WorkflowStateBarRejected } from "./Bars/WorkflowStateBarRejected.js";

export interface IWorkflowStateBarProps {
    id: string;
    app: string;
    identity: IIdentity;
    client: ApolloClient<object>;
}

export const WorkflowStateBar = (props: IWorkflowStateBarProps) => {
    const { id, app, identity, client } = props;

    const presenter = useMemo(() => {
        const gateway = new WorkflowStateGateway({
            client
        });
        const repository = new WorkflowStateRepository({
            gateway
        });
        const presenter = new WorkflowStatePresenter({
            app,
            targetRevisionId: id,
            identity,
            repository
        });
        presenter.init();
        return presenter;
    }, [app, id, identity, client]);

    return (
        <>
            <Plugins>
                <WorkflowStateBarStartReview />
                <WorkflowStateBarReview />
                <WorkflowStateBarRequestReview />
                <WorkflowStateBarCancelReview />
                <WorkflowStateBarApproved />
                <WorkflowStateBarRejected />
                <WorkflowStateBarLoading />
                <WorkflowStateBarError />
            </Plugins>
            <WorkflowStateBarObserver presenter={presenter} />
        </>
    );
};
