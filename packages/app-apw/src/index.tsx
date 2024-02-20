import React from "react";
import { Compose, MenuItemRenderer, Plugins, useWcp } from "@webiny/app-admin";
/**
 * Plugins for "page builder"
 */
import { ApwOnPublish } from "./plugins/pageBuilder/ApwOnPublish";
import { ApwOnPageDelete } from "./plugins/pageBuilder/ApwOnDelete";
import { DecoratePublishActions } from "./plugins/pageBuilder/DecoratePublishActions";

import { ApwPageBuilderWorkflowScope } from "~/views/publishingWorkflows/components/pageBuilder/ApwPageBuilderWorkflowScope";
/**
 * Plugins for "Headless CMS"
 */
import { ApwOnEntryDelete } from "~/plugins/cms/ApwOnEntryDelete";
import { ApwOnEntryPublish } from "~/plugins/cms/ApwOnEntryPublish";
import { SaveAndPublishButton as HeadlessCmsEntrySaveAndPublishButton } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Header";
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

export const AdvancedPublishingWorkflow = () => {
    const { canUseFeature } = useWcp();
    if (!canUseFeature("advancedPublishingWorkflow")) {
        return null;
    }
    return (
        <>
            <DecoratePublishActions />
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
