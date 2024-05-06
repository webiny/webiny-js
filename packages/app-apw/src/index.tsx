import React from "react";
import { Compose, MenuItemRenderer, Plugins, useWcp } from "@webiny/app-admin";
/**
 * Plugins for "page builder"
 */
import { ApwOnPublish } from "./plugins/pageBuilder/ApwOnPublish";
import { ApwOnPageDelete } from "./plugins/pageBuilder/ApwOnDelete";
import { DecoratePagePublishActions } from "./plugins/pageBuilder/DecoratePagePublishActions";

import { ApwPageBuilderWorkflowScope } from "~/views/publishingWorkflows/components/pageBuilder/ApwPageBuilderWorkflowScope";
/**
 * Plugins for "Headless CMS"
 */
import { ApwOnEntryDelete } from "~/plugins/cms/ApwOnEntryDelete";
import { ApwOnEntryPublish } from "~/plugins/cms/ApwOnEntryPublish";
import { PublishEntryRevisionListItem } from "@webiny/app-headless-cms/admin/views/contentEntries/ContentEntry/RevisionsList/PublishEntryRevisionListItem";
import { ApwHeadlessCmsWorkflowScope } from "~/views/publishingWorkflows/components/cms/ApwHeadlessCmsWorkflowScope";
import { DecoratePublishEntryAction, EntryRevisionListItem } from "~/plugins/cms/PublishEntryHocs";
/**
 *
 */
import { Module } from "~/plugins/Module";
import { WorkflowScope } from "~/views/publishingWorkflows/components/WorkflowScope";
import { DefaultBar } from "~/plugins/editor/defaultBar";
import { MenuGroupRenderer } from "~/plugins/cms/MenuGroupRenderer";
import { ApwPermissions } from "~/plugins/permissionRenderer";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";

export const AdvancedPublishingWorkflow = () => {
    const { canUseFeature } = useWcp();

    if (!canUseFeature("advancedPublishingWorkflow")) {
        return null;
    }
    return (
        <>
            <Compose
                with={[ApwPageBuilderWorkflowScope, ApwHeadlessCmsWorkflowScope]}
                component={WorkflowScope}
            />
            <Compose with={MenuGroupRenderer} component={MenuItemRenderer} />
            <ContentEntryEditorConfig>
                <DecoratePublishEntryAction />
                <Compose with={EntryRevisionListItem} component={PublishEntryRevisionListItem} />
                <ApwOnEntryDelete />
                <ApwOnEntryPublish />
            </ContentEntryEditorConfig>
            <Plugins>
                <DefaultBar />
                <Module />
                <DecoratePagePublishActions />
                <ApwOnPublish />
                <ApwOnPageDelete />
                <ApwPermissions />
            </Plugins>
        </>
    );
};
