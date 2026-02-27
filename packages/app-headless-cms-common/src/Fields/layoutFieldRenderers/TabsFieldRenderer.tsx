import React from "react";
import { Grid, FormComponentLabel, FormComponentDescription, Tabs } from "@webiny/admin-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CmsTabLayoutDescriptor } from "~/types/model.js";
import type { BindComponent, CmsEditorContentModel, CmsModelField } from "~/types/index.js";
import { normalizeIcon } from "~/normalizeIcon.js";
import { Fields } from "~/Fields/index.js";
import { useAuthentication } from "@webiny/app-admin";
import { getFieldPermissions } from "~/Fields/getFieldPermissions.js";
import { FieldPermissionProvider, useFieldPermissions } from "~/Fields/FieldPermissionProvider.js";

interface TabsFieldRendererProps {
    descriptor: CmsTabLayoutDescriptor;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

export const TabsFieldRenderer = ({
    descriptor,
    Bind,
    fields,
    contentModel,
    gridClassName
}: TabsFieldRendererProps) => {
    const { identity } = useAuthentication();
    const parentPermissions = useFieldPermissions();

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
                tabs={descriptor.tabs
                    .filter(tab => {
                        const perms = getFieldPermissions(identity, tab);
                        return parentPermissions.canView && perms.canView;
                    })
                    .map(tab => {
                        const tabPermissions = getFieldPermissions(identity, tab);
                        const effectivePermissions = {
                            canView: parentPermissions.canView && tabPermissions.canView,
                            canEdit: parentPermissions.canEdit && tabPermissions.canEdit
                        };
                        const icon = normalizeIcon(tab.icon);
                        return (
                            <Tabs.Tab
                                key={tab.id}
                                visible={effectivePermissions.canView}
                                value={tab.id}
                                trigger={tab.label}
                                icon={
                                    icon ? <FontAwesomeIcon icon={icon} size={"sm"} /> : undefined
                                }
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
                    })}
            />
        </Grid.Column>
    );
};
