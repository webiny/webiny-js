import React from "react";
import { Compose, MenuItemRenderer, Plugins, useWcp } from "@webiny/app-admin";
/**
 * Plugins for "page builder"
 */
import { ApwOnPublish } from "./plugins/pageBuilder/ApwOnPublish";
import { ApwOnPageDelete } from "./plugins/pageBuilder/ApwOnDelete";
import {
    PublishPageButtonHoc,
    PublishRevisionHoc,
    PublishPageMenuOptionHoc,
    PageRevisionListItemGraphicHoc
} from "./plugins/pageBuilder/PublishPageHocs";
/**
 * TODO: Fix this import so that we can import it from root level maybe
 */
import PagePublishRevision from "@webiny/app-page-builder/admin/plugins/pageDetails/header/publishRevision/PublishRevision";
import { PublishPageMenuOption } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PublishPageMenuOption";
import { PublishPageButton } from "@webiny/app-page-builder/pageEditor";
import { PageRevisionListItemGraphic } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PageRevisionListItemGraphic";
import { ApwPageBuilderWorkflowScope } from "~/views/publishingWorkflows/components/pageBuilder/ApwPageBuilderWorkflowScope";
/**
 * Plugins for "Headless CMS"
 */
import { ApwOnEntryDelete } from "~/plugins/cms/ApwOnEntryDelete";
import { ApwOnEntryPublish } from "~/plugins/cms/ApwOnEntryPublish";
import { SaveAndPublishButton as HeadlessCmsEntrySaveAndPublishButton } from "@webiny/app-headless-cms/admin/views/contentEntries/ContentEntry/header/saveAndPublishContent/SaveAndPublishContent";
import { PublishEntryRevisionListItem } from "@webiny/app-headless-cms/admin/views/contentEntries/ContentEntry/PublishEntryRevisionListItem";
import { ApwHeadlessCmsWorkflowScope } from "~/views/publishingWorkflows/components/cms/ApwHeadlessCmsWorkflowScope";
import {
    EntryRevisionListItemGraphicHoc,
    PublishEntryButtonHoc
} from "~/plugins/cms/PublishEntryHocs";
/**
 *
 */
import { Module } from "~/plugins/Module";
import { WorkflowScope } from "~/views/publishingWorkflows/components/WorkflowScope";
import { DefaultBar } from "~/plugins/editor/defaultBar";
import { MenuGroupRenderer } from "~/plugins/cms/MenuGroupRenderer";
import { ApwPermissions } from "~/plugins/permissionRenderer";
import { Module as MailerSettings } from "@webiny/app-mailer";

export const AdvancedPublishingWorkflow: React.FC = () => {
    const { canUseFeature } = useWcp();
    if (!canUseFeature("advancedPublishingWorkflow")) {
        return null;
    }
    return (
        <>
            <Compose with={PublishRevisionHoc} component={PagePublishRevision} />
            <Compose with={PublishPageMenuOptionHoc} component={PublishPageMenuOption} />
            <Compose with={PublishPageButtonHoc} component={PublishPageButton} />
            <Compose
                with={PageRevisionListItemGraphicHoc}
                component={PageRevisionListItemGraphic}
            />
            <Compose
                with={[ApwPageBuilderWorkflowScope, ApwHeadlessCmsWorkflowScope]}
                component={WorkflowScope}
            />
            <Compose
                with={PublishEntryButtonHoc}
                component={HeadlessCmsEntrySaveAndPublishButton}
            />
            <Compose
                with={EntryRevisionListItemGraphicHoc}
                component={PublishEntryRevisionListItem}
            />
            <Compose with={MenuGroupRenderer} component={MenuItemRenderer} />
            <Plugins>
                <DefaultBar />
                <MailerSettings />
                <Module />
                <ApwOnPublish />
                <ApwOnPageDelete />
                <ApwOnEntryDelete />
                <ApwOnEntryPublish />
                <ApwPermissions />
            </Plugins>
        </>
    );
};
