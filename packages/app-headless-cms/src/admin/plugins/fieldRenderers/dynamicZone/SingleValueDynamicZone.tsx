import React from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { AddTemplateButton } from "./AddTemplate";
import { TemplateIcon } from "./TemplateIcon";
import { TemplateProvider } from "./TemplateProvider";
import {
    BindComponentRenderProp,
    CmsDynamicZoneTemplate,
    CmsModelFieldRendererProps,
    CmsModel,
    CmsModelField,
    CmsDynamicZoneTemplateWithTypename
} from "~/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { ParentFieldProvider } from "~/admin/components/ContentEntryForm/ParentValue";
import {
    ParentValueIndexProvider,
    ModelFieldProvider
} from "~/admin/components/ModelFieldProvider";

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
    const onTemplate = (template: CmsDynamicZoneTemplateWithTypename) => {
        bind.onChange({ _templateId: template.id, __typename: template.__typename });
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
                <ParentFieldProvider value={bind.value} path={Bind.parentName}>
                    <ParentValueIndexProvider index={-1}>
                        <ModelFieldProvider field={field}>
                            <Accordion>
                                <AccordionItem
                                    title={template.name}
                                    description={template.description}
                                    icon={<TemplateIcon icon={template.icon} />}
                                    open={true}
                                    interactive={false}
                                    actions={
                                        <AccordionItem.Actions>
                                            <AccordionItem.Action
                                                icon={<DeleteIcon />}
                                                onClick={unsetValue}
                                            />
                                        </AccordionItem.Actions>
                                    }
                                >
                                    <TemplateProvider template={template}>
                                        <Fields
                                            fields={template.fields}
                                            layout={template.layout || []}
                                            contentModel={contentModel}
                                            Bind={Bind}
                                        />
                                    </TemplateProvider>
                                </AccordionItem>
                            </Accordion>
                        </ModelFieldProvider>
                    </ParentValueIndexProvider>
                </ParentFieldProvider>
            ) : null}
            {bind.value ? null : <AddTemplateButton onTemplate={onTemplate} />}
        </>
    );
};
