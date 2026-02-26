import React from "react";
import { Grid, FormComponentLabel, FormComponentDescription, Tabs } from "@webiny/admin-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CmsTabLayoutDescriptor } from "~/types/model.js";
import type { BindComponent, CmsEditorContentModel, CmsModelField } from "~/types/index.js";
import type { CmsEditorFieldsLayout } from "~/types/model.js";
import { normalizeIcon } from "~/normalizeIcon.js";

interface TabsFieldRendererProps {
    descriptor: CmsTabLayoutDescriptor;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
    FieldsComponent: React.ComponentType<{
        Bind: BindComponent;
        fields: CmsModelField[];
        layout: CmsEditorFieldsLayout;
        contentModel: CmsEditorContentModel;
        gridClassName?: string;
    }>;
}

export const TabsFieldRenderer = ({
    descriptor,
    Bind,
    fields,
    contentModel,
    gridClassName,
    FieldsComponent
}: TabsFieldRendererProps) => {
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
                tabs={descriptor.tabs.map(tab => {
                    const icon = normalizeIcon(tab.icon);
                    return (
                        <Tabs.Tab
                            key={tab.id}
                            value={tab.id}
                            trigger={tab.label}
                            icon={icon ? <FontAwesomeIcon icon={icon} size={"sm"} /> : undefined}
                            content={
                                <FieldsComponent
                                    Bind={Bind}
                                    fields={fields}
                                    layout={tab.layout}
                                    contentModel={contentModel}
                                    gridClassName={gridClassName}
                                />
                            }
                        />
                    );
                })}
            />
        </Grid.Column>
    );
};
