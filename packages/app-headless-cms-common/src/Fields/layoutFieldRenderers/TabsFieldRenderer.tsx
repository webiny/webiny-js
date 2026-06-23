import React from "react";
import { Grid, FormComponentLabel, FormComponentDescription, Tabs } from "@webiny/admin-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CmsTabLayoutField, CmsTabLayoutTab } from "~/types/model.js";
import type { BindComponent, CmsEditorContentModel, CmsModelField } from "~/types/index.js";
import { normalizeIcon } from "~/normalizeIcon.js";
import { FieldRulesProvider } from "~/Fields/FieldRulesProvider.js";
import { useFieldEffectiveRules } from "~/Fields/useFieldRules.js";

interface TabsFieldRendererProps {
    field: CmsTabLayoutField;
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

const TabPanel = ({ tab }: TabPanelProps) => {
    const rules = useFieldEffectiveRules(tab);

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
                    <div>Legacy Fields</div>
                </FieldRulesProvider>
            }
        />
    );
};

const tabsWrapperClassName = [
    "bg-white!",
    "opacity-100!",
    "border-neutral-muted",
    "text-neutral-strong",
    "fill-neutral-xstrong",
    "w-full",
    "border-sm",
    "rounded-md"
].join(" ");

export const TabsFieldRenderer = ({
    field,
    Bind,
    fields,
    contentModel,
    gridClassName
}: TabsFieldRendererProps) => {
    const tabElements = field.tabs.map(tab => (
        <TabPanel
            key={tab.id}
            tab={tab}
            Bind={Bind}
            fields={fields}
            contentModel={contentModel}
            gridClassName={gridClassName}
        />
    ));

    const firstTab = field.tabs[0];

    return (
        <Grid.Column span={12}>
            {field.label ? <FormComponentLabel text={field.label} hint={field.help} /> : null}
            {field.description ? <FormComponentDescription text={field.description} /> : null}
            <div className={tabsWrapperClassName}>
                <Tabs
                    size="md"
                    spacing="md"
                    separator={true}
                    tabs={tabElements}
                    defaultValue={firstTab?.id}
                />
            </div>
        </Grid.Column>
    );
};
