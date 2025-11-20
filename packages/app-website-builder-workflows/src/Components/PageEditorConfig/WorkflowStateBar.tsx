import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useSecurity } from "@webiny/app-security";
import { WorkflowStateProvider } from "@webiny/app-workflows";
import { WB_PAGE_APP } from "~/constants.js";
import { usePage } from "@webiny/app-website-builder/modules/pages/PagesList/hooks/usePage.js";

export const WorkflowStateBar = () => {
    const { page } = usePage();
    
    const client = useApolloClient();

    const { identity } = useSecurity();

    return (
        <WorkflowStateProvider
            app={WB_PAGE_APP}
            id={page.id}
            identity={identity}
            client={client}
            title={`Testing`}
        >
            <></>
        </WorkflowStateProvider>
    );
};
