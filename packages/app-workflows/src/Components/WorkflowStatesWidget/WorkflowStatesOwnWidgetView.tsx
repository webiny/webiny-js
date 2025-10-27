import React, { useMemo } from "react";
import type { IIdentity } from "~/types.js";
import type ApolloClient from "apollo-client";
import type { IWorkflowStatesWidgetPresenter } from "~/Presenters/index.js";
import { WorkflowStatesOwnWidgetPresenter } from "~/Presenters/index.js";
import { WorkflowStatesWidgetRepository } from "~/Repositories/index.js";
import { Card, Icon, Tabs } from "@webiny/admin-ui";
import { ReactComponent as ReviewRequestsIcon } from "@webiny/icons/reviews.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { WorkflowStateList } from "~/Components/WorkflowStatesWidget/State/WorkflowStateList.js";
import { observer } from "mobx-react-lite";
import { WorkflowStatesWidgetGateway } from "~/Gateways/index.js";

interface IWorkflowStatesWidgetViewProps {
    client: ApolloClient<object>;
}

interface WorkflowStatesWidgetViewObserverProps {
    presenter: IWorkflowStatesWidgetPresenter;
}

const WorkflowStatesWidgetViewObserver = observer(
    (props: WorkflowStatesWidgetViewObserverProps) => {
        const { presenter } = props;
        return (
            <Card
                title={
                    <>
                        <Icon
                            icon={<ReviewRequestsIcon />}
                            color={"accent"}
                            label={"Review Requests"}
                        />
                        Review Requests
                    </>
                }
                options={
                    <>
                        <Icon icon={<AddIcon />} label={"View All"} color={"neutral-strong"} />
                        View All
                    </>
                }
                padding="standard"
                elevation="md"
                borderRadius="md"
            >
                <Tabs
                    size="sm"
                    separator={false}
                    tabs={[
                        <Tabs.Tab
                            key="inReview"
                            value="inReview"
                            trigger="In Review"
                            content={<WorkflowStateList states={presenter.vm.inReview} />}
                        />,
                        <Tabs.Tab
                            key="approved"
                            value="approved"
                            trigger="Approved"
                            content={<WorkflowStateList states={presenter.vm.approved} />}
                        />,
                        <Tabs.Tab
                            key="declined"
                            value="declined"
                            trigger="Declined"
                            content={<WorkflowStateList states={presenter.vm.rejected} />}
                        />
                    ]}
                />
            </Card>
        );
    }
);

export const WorkflowStatesOwnWidgetView = (props: IWorkflowStatesWidgetViewProps) => {
    const { client } = props;

    const presenter = useMemo(() => {
        const gateway = new WorkflowStatesWidgetGateway({
            client
        });
        const repository = new WorkflowStatesWidgetRepository({
            gateway
        });
        return new WorkflowStatesOwnWidgetPresenter({
            repository,
        });
    }, []);

    return <WorkflowStatesWidgetViewObserver presenter={presenter} />;
};
