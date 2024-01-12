import React from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { AddTemplateButton } from "./AddTemplate";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import {
    BindComponentRenderProp,
    CmsDynamicZoneTemplate,
    CmsModelFieldRendererProps,
    CmsModel,
    CmsModelField
} from "~/types";

type GetBind = CmsModelFieldRendererProps["getBind"];

interface SingleValueDynamicZoneProps {
    field: CmsModelField;
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
        bind.onChange({ _templateId: template.id });
    };

    const templates = field.settings?.templates || [];

    const template: CmsDynamicZoneTemplate | undefined = bind.value
        ? templates.find(tpl => tpl.id === bind.value._templateId)
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
                        icon={<IconPicker.Icon icon={template.icon} />}
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
