import React from "react";
import { Grid, FormComponentLabel, FormComponentDescription, Tabs } from "@webiny/admin-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CmsTabLayoutDescriptor, CmsTabLayoutTab } from "~/types/model.js";
import type { BindComponent, CmsEditorContentModel, CmsModelField } from "~/types/index.js";
import { normalizeIcon } from "~/normalizeIcon.js";
import { Fields } from "~/Fields/index.js";
import { FieldRulesProvider } from "~/Fields/FieldRulesProvider.js";
import { useEffectiveRules } from "~/Fields/useFieldRules.js";

interface TabsFieldRendererProps {
    descriptor: CmsTabLayoutDescriptor;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

interface TabPanelProps {
    tab: CmsTabLayoutTab;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

const TabPanel = ({ tab, Bind, fields, contentModel, gridClassName }: TabPanelProps) => {
    const rules = useEffectiveRules(tab);

    const icon = normalizeIcon(tab.icon);

    return (
        <Tabs.Tab
            disabled={rules.disabled}
            visible={rules.canView && !rules.hidden}
            value={tab.id}
            trigger={tab.label}
            icon={icon ? <FontAwesomeIcon icon={icon} size={"sm"} /> : undefined}
            content={
                <FieldRulesProvider rules={rules}>
                    <Fields
                        Bind={Bind}
                        fields={fields}
                        layout={tab.layout}
                        contentModel={contentModel}
                        gridClassName={gridClassName}
                    />
                </FieldRulesProvider>
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
    const tabElements = descriptor.tabs.map(tab => (
        <TabPanel
            key={tab.id}
            tab={tab}
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
