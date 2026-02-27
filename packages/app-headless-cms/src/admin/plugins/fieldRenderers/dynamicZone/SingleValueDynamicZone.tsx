import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { makeDecoratable, useConfirmationDialog } from "@webiny/app-admin";
import { Accordion, Tooltip } from "@webiny/admin-ui";
import { AddTemplateButton } from "./AddTemplate.js";
import { TemplateIcon } from "./TemplateIcon.js";
import { TemplateProvider } from "./TemplateProvider.js";
import type {
    BindComponentRenderProp,
    CmsDynamicZoneTemplate,
    CmsModelFieldRendererProps,
    CmsModel,
    CmsModelField,
    CmsDynamicZoneTemplateWithTypename
} from "~/types.js";
import { Fields } from "~/admin/components/ContentEntryForm/Fields.js";
import { ParentFieldProvider } from "~/admin/components/ContentEntryForm/ParentValue.js";
import {
    ParentValueIndexProvider,
    ModelFieldProvider,
    useModelField
} from "~/admin/components/ModelFieldProvider/index.js";

type GetBind = CmsModelFieldRendererProps["getBind"];

interface SingleValueDynamicZoneProps {
    field: CmsModelField;
    bind: BindComponentRenderProp;
    contentModel: CmsModel;
    getBind: GetBind;
}

interface TemplateValue {
    _templateId: string;
    [key: string]: any;
}

export interface SingleValueItemContainerProps {
    value: TemplateValue;
    contentModel: CmsModel;
    onDelete: () => void;
    title: React.ReactNode;
    description: string;
    disabled?: boolean;
    icon: JSX.Element;
    actions?: JSX.Element;
    template: CmsDynamicZoneTemplate;
    children: React.ReactNode;
}

export const SingleValueItemContainer = makeDecoratable(
    "SingleValueItemContainer",
    (props: SingleValueItemContainerProps) => {
        const { template, actions, children, disabled = false } = props;

        const accordionActions = disabled ? null : (
            <>
                {actions ?? null}
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<DeleteIcon />} content={"Delete"} />}
                    onClick={props.onDelete}
                />
            </>
        );

        return (
            <Accordion.Item
                title={template.name}
                description={template.description}
                icon={<TemplateIcon icon={template.icon} />}
                actions={accordionActions}
            >
                {children}
            </Accordion.Item>
        );
    }
);

export const SingleValueDynamicZone = ({
    bind,
    contentModel,
    getBind
}: SingleValueDynamicZoneProps) => {
    const { field, permissions } = useModelField();
    const { showConfirmation } = useConfirmationDialog({
        message: `Are you sure you want to remove this item? This action is not reversible.`,
        acceptLabel: `Yes, I'm sure!`,
        cancelLabel: `No, leave it.`
    });

    const onTemplate = (template: CmsDynamicZoneTemplateWithTypename) => {
        bind.onChange({ _templateId: template.id, __typename: template.__typename });
    };

    const templates = field.settings?.templates || [];

    const template: CmsDynamicZoneTemplate | undefined = bind.value
        ? templates.find(tpl => tpl.id === bind.value._templateId)
        : undefined;

    const Bind = getBind();

    const unsetValue = () => {
        showConfirmation(() => {
            bind.onChange(null);
        });
    };

    return (
        <>
            {template ? (
                <ParentFieldProvider value={bind.value} path={Bind.parentName}>
                    <ParentValueIndexProvider index={-1}>
                        <ModelFieldProvider field={field}>
                            <Accordion background={"base"} variant={"container"}>
                                <SingleValueItemContainer
                                    disabled={!permissions.canEdit}
                                    template={template}
                                    value={bind.value}
                                    contentModel={contentModel}
                                    onDelete={unsetValue}
                                    title={template.name}
                                    description={template.description}
                                    icon={<TemplateIcon icon={template.icon} />}
                                >
                                    <TemplateProvider template={template}>
                                        <Fields
                                            fields={template.fields}
                                            layout={template.layout || []}
                                            contentModel={contentModel}
                                            Bind={Bind}
                                        />
                                    </TemplateProvider>
                                </SingleValueItemContainer>
                            </Accordion>
                        </ModelFieldProvider>
                    </ParentValueIndexProvider>
                </ParentFieldProvider>
            ) : null}
            {bind.value ? null : <AddTemplateButton onTemplate={onTemplate} />}
        </>
    );
};
