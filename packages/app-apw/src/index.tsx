import React from "react";
import { Compose, Plugins, useWcp } from "@webiny/app-admin";
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
import { ApwPermissions } from "~/plugins/permissionRenderer";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";

export const AdvancedPublishingWorkflow = () => {
    const wcp = useWcp();

    if (!wcp.canUseFeature("advancedPublishingWorkflow")) {
        return null;
    }

    return (
        <>
            <Compose with={[ApwHeadlessCmsWorkflowScope]} component={WorkflowScope} />
            <ContentEntryEditorConfig>
                <DecoratePublishEntryAction />
                <Compose with={EntryRevisionListItem} component={PublishEntryRevisionListItem} />
                <ApwOnEntryDelete />
                <ApwOnEntryPublish />
            </ContentEntryEditorConfig>

            <Module />

            <Plugins>
                <DefaultBar />
                <ApwPermissions />
            </Plugins>
        </>
    );
};
