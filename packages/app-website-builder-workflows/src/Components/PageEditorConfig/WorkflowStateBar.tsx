import React from "react";
import { WorkflowStateProvider } from "@webiny/app-workflows";
import { WB_PAGE_APP } from "~/constants.js";
import { PageFormWorkflow } from "./PageFormWorkflow.js";
import { useApolloClient } from "@apollo/react-hooks";
import { useSecurity } from "@webiny/app-security";

interface IWorkflowStateBarPropsPage {
    id: string;
    title: string;
}

interface IWorkflowStateBarProps {
    page: IWorkflowStateBarPropsPage;
}

export const WorkflowStateBar = (props: IWorkflowStateBarProps) => {
    const { page } = props;
    const client = useApolloClient();
    const { identity } = useSecurity();

    return (
        <WorkflowStateProvider
            app={WB_PAGE_APP}
            id={page.id}
            identity={identity}
            client={client}
            title={page.title}
        >
            <PageFormWorkflow />
        </WorkflowStateProvider>
    );
};
