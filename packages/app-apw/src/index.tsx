import React from "react";
import { Compose, Plugins } from "@webiny/app-admin";
import defaultBar from "./plugins/editor/defaultBar";
/**
 * Plugins for "page builder"
 */
import { ApwOnPublish } from "./plugins/pageBuilder/ApwOnPublish";
import { ApwOnPageDelete } from "./plugins/pageBuilder/ApwOnDelete";
import {
    PublishPageButtonHoc,
    PublishRevisionHoc,
    PublishPageMenuOptionHoc,
    PageRequestChangesHoc,
    PageRequestReviewHoc,
    PageRevisionListItemGraphicHoc
} from "./plugins/pageBuilder/PublishPageHocs";
// TODO: Fix this import so that we can import it from root level maybe
import PublishRevision from "@webiny/app-page-builder/admin/plugins/pageDetails/header/publishRevision/PublishRevision";
import { PublishPageMenuOption } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PublishPageMenuOption";
import { PublishPageButtonComposable } from "@webiny/app-page-builder/editor/plugins/defaultBar/components/PublishPageButton";
import RequestReview from "@webiny/app-page-builder/admin/plugins/pageDetails/header/requestReview/RequestReview";
import RequestChanges from "@webiny/app-page-builder/admin/plugins/pageDetails/header/requestChanges/RequestChanges";
import { PageRevisionListItemGraphic } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PageRevisionListItemGraphic";
import { Routes } from "~/plugins/Routes";
import { Menus } from "~/plugins/Menus";
import { ApwPageBuilderWorkflowScope } from "~/views/publishingWorkflows/components/pageBuilder/ApwPageBuilderWorkflowScope";
import { ApwHeadlessCmsWorkflowScope } from "~/views/publishingWorkflows/components/cms/ApwHeadlessCmsWorkflowScope";
import { WorkflowScope } from "~/views/publishingWorkflows/components/WorkflowScope";

export const plugins = () => [defaultBar];

export const AdvancedPublishingWorkflow: React.FC = () => {
    return (
        <>
            <Compose with={PublishRevisionHoc} component={PublishRevision} />
            <Compose with={PublishPageMenuOptionHoc} component={PublishPageMenuOption} />
            <Compose with={PublishPageButtonHoc} component={PublishPageButtonComposable} />
            <Compose with={PageRequestReviewHoc} component={RequestReview} />
            <Compose with={PageRequestChangesHoc} component={RequestChanges} />
            <Compose
                with={PageRevisionListItemGraphicHoc}
                component={PageRevisionListItemGraphic}
            />
            <Compose
                with={[ApwPageBuilderWorkflowScope, ApwHeadlessCmsWorkflowScope]}
                component={WorkflowScope}
            />
            <Plugins>
                <Routes />
                <Menus />
                <ApwOnPublish />
                <ApwOnPageDelete />
            </Plugins>
        </>
    );
};
