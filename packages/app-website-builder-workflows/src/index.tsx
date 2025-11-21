import React from "react";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { Wcp } from "@webiny/app-admin";
import { PageEditor } from "~/Components/PageEditor/index.js";
import { PagesListContentReviews } from "~/Components/PagesList/PagesListContentReviews.js";
import { PageListConfig } from "@webiny/app-website-builder/modules/pages/configs/index.js";
import { ListOpenInNewWindow } from "~/Components/PagesList/OptionItem/OpenInNewWindow.js";

export const WebsiteBuilderWorkflows = () => {
    return (
        <Wcp.CanUseWorkflows>
            <WebsiteBuilderWorkflowsMenu />
            <PageEditor />
            <ListOpenInNewWindow />
            <PageListConfig>
                <PagesListContentReviews />
            </PageListConfig>
        </Wcp.CanUseWorkflows>
    );
};
