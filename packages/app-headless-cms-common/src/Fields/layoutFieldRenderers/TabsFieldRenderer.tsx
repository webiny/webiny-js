import React from "react";
import { Grid, FormComponentLabel, FormComponentDescription, Tabs } from "@webiny/admin-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CmsTabLayoutDescriptor, CmsTabLayoutTab } from "~/types/model.js";
import type { BindComponent, CmsEditorContentModel, CmsModelField } from "~/types/index.js";
import { normalizeIcon } from "~/normalizeIcon.js";
import { Fields } from "~/Fields/index.js";
import { useAuthentication } from "@webiny/app-admin";
import { getFieldPermissions, type FieldPermissions } from "~/Fields/getFieldPermissions.js";
import { FieldPermissionProvider, useFieldPermissions } from "~/Fields/FieldPermissionProvider.js";
import { useFieldRules } from "~/Fields/useFieldRules.js";

interface TabsFieldRendererProps {
    descriptor: CmsTabLayoutDescriptor;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

interface TabPanelProps {
    tab: CmsTabLayoutTab;
    parentPermissions: FieldPermissions;
    identity: { id: string; teams: { id: string }[] };
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

const TabPanel = ({
    tab,
    parentPermissions,
    identity,
    Bind,
    fields,
    contentModel,
    gridClassName
}: TabPanelProps) => {
    const rulePermissions = useFieldRules(tab, Bind.parentName);
    const identityPermissions = getFieldPermissions(identity, tab);
    const effectivePermissions: FieldPermissions = {
        canView:
            parentPermissions.canView && identityPermissions.canView && rulePermissions.canView,
        canEdit: parentPermissions.canEdit && identityPermissions.canEdit && rulePermissions.canEdit
    };

    const icon = normalizeIcon(tab.icon);

    return (
        <Tabs.Tab
            disabled={!effectivePermissions.canEdit}
            visible={effectivePermissions.canView}
            value={tab.id}
            trigger={tab.label}
            icon={icon ? <FontAwesomeIcon icon={icon} size={"sm"} /> : undefined}
            content={
                <FieldPermissionProvider permissions={effectivePermissions}>
                    <Fields
                        Bind={Bind}
                        fields={fields}
                        layout={tab.layout}
                        contentModel={contentModel}
                        gridClassName={gridClassName}
                    />
                </FieldPermissionProvider>
            }
        />
    );
};

export const TabsFieldRenderer = ({
    descriptor,
    Bind,
    fields,
    contentModel,
    gridClassName
}: TabsFieldRendererProps) => {
    const { identity } = useAuthentication();
    const parentPermissions = useFieldPermissions();

    const tabElements = descriptor.tabs.map(tab => (
        <TabPanel
            key={tab.id}
            tab={tab}
            parentPermissions={parentPermissions}
            identity={identity}
            Bind={Bind}
            fields={fields}
            contentModel={contentModel}
            gridClassName={gridClassName}
        />
    ));

    const firstTab = descriptor.tabs[0];

    return (
        <Grid.Column span={12}>
            {descriptor.label ? (
                <FormComponentLabel text={descriptor.label} hint={descriptor.help} />
            ) : null}
            {descriptor.description ? (
                <FormComponentDescription text={descriptor.description} />
            ) : null}
            <Tabs
                size="md"
                spacing="md"
                separator={true}
                tabs={tabElements}
                defaultValue={firstTab?.id}
            />
        </Grid.Column>
    );
};
