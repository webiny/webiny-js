import React from "react";
import { Wcp } from "@webiny/app-admin";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { PageEditor } from "~/Components/PageEditor/index.js";
import { ListOpenInNewWindow } from "~/Components/OptionItem/index.js";
import { PageList } from "~/Components/PagesList/index.js";

export const WebsiteBuilderWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <WebsiteBuilderWorkflowsMenu />
            <PageEditor />
            <PageList />
            <ListOpenInNewWindow />
        </Wcp.CanUseWorkflows>
    );
};
