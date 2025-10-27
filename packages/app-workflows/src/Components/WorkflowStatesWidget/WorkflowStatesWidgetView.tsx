import React, { useMemo } from "react";
import type { IIdentity } from "~/types.js";
import type ApolloClient from "apollo-client";
import { WorkflowStatesWidgetRepository } from "~/Repositories/index.js";
import { WorkflowStatesWidgetPresenter } from "~/Presenters/index.js";
import { Card, Icon, Tabs } from "@webiny/admin-ui";
import { ReactComponent as ReviewRequestsIcon } from "@webiny/icons/reviews.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { WorkflowStateList } from "~/Components/WorkflowStatesWidget/State/WorkflowStateList.js";
import type { IWorkflowStatesWidgetPresenter } from "~/Presenters/abstractions/WorkflowStatesWidgetPresenter.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStatesWidgetViewProps {
    identity: IIdentity;
    client: ApolloClient<object>;
}

interface WorkflowStatesWidgetViewObservableProps {
    presenter: IWorkflowStatesWidgetPresenter;
}

const WorkflowStatesWidgetViewObservable = observer(
    (props: WorkflowStatesWidgetViewObservableProps) => {
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
                            content={<WorkflowStateList states={presenter.vm.declined} />}
                        />
                    ]}
                />
            </Card>
        );
    }
);

export const WorkflowStatesWidgetView = (props: IWorkflowStatesWidgetViewProps) => {
    const { identity, client } = props;

    const presenter = useMemo(() => {
        const repository = new WorkflowStatesWidgetRepository({});

        return new WorkflowStatesWidgetPresenter({
            repository,
            identity
        });
    }, [identity.id, client]);

    return <WorkflowStatesWidgetViewObservable presenter={presenter} />;
};
