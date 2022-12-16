import React from "react";

import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { AddTemplateButton } from "./AddTemplate";
import { TemplateIcon } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateIcon";
import {
    BindComponentRenderProp,
    CmsDynamicZoneTemplate,
    CmsEditorFieldRendererProps,
    CmsModel,
    CmsEditorField
} from "~/types";

type GetBind = CmsEditorFieldRendererProps["getBind"];

interface SingleValueDynamicZoneProps {
    field: CmsEditorField;
    bind: BindComponentRenderProp;
    contentModel: CmsModel;
    getBind: GetBind;
}

export const SingleValueDynamicZone = ({
    field,
    bind,
    contentModel,
    getBind
}: SingleValueDynamicZoneProps) => {
    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        bind.onChange({ __template: template.id });
    };

    const templates = field.settings?.templates || [];

    const template: CmsDynamicZoneTemplate | undefined = bind.value
        ? templates.find(tpl => tpl.id === bind.value.__template)
        : undefined;

    const Bind = getBind();

    const unsetValue = () => {
        bind.onChange(null);
    };

    return (
        <>
            {template ? (
                <Accordion>
                    <AccordionItem
                        title={template.name}
                        description={template.description}
                        icon={<TemplateIcon icon={template.icon} />}
                        open={true}
                        interactive={false}
                        actions={
                            <AccordionItem.Actions>
                                <AccordionItem.Action icon={<DeleteIcon />} onClick={unsetValue} />
                            </AccordionItem.Actions>
                        }
                    >
                        <Fields
                            fields={template.fields}
                            layout={template.layout || []}
                            contentModel={contentModel}
                            Bind={Bind}
                        />
                    </AccordionItem>
                </Accordion>
            ) : null}
            {bind.value ? null : <AddTemplateButton onTemplate={onTemplate} />}
        </>
    );
};
