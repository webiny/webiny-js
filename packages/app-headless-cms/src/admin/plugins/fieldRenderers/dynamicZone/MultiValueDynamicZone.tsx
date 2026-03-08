import React from "react";
import cloneDeep from "lodash/cloneDeep.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as CloneIcon } from "@webiny/icons/library_add.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/expand_less.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/expand_more.svg";
import { AddTemplateButton } from "./AddTemplate.js";
import { TemplateIcon } from "./TemplateIcon.js";
import { useFieldEffectiveRules } from "@webiny/app-headless-cms-common";
import { ParentFieldProvider, useModelField } from "~/admin/hooks/index.js";
import { Fields } from "~/admin/components/ContentEntryForm/Fields.js";
import type {
    BindComponent,
    BindComponentRenderProp,
    CmsDynamicZoneTemplate,
    CmsModelFieldRendererProps,
    CmsModel,
    CmsModelField,
    CmsDynamicZoneTemplateWithTypename
} from "~/types.js";
import { makeDecoratable } from "@webiny/react-composition";
import { TemplateProvider } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateProvider.js";
import {
    CanEditField,
    ParentValueIndexProvider
} from "~/admin/components/ModelFieldProvider/index.js";
import { useConfirmationDialog } from "@webiny/app-admin";
import { Accordion, Tooltip } from "@webiny/admin-ui";

type GetBind = CmsModelFieldRendererProps["getBind"];

export interface MultiValueItemContainerProps {
    value: TemplateValue;
    contentModel: CmsModel;
    isFirst: boolean;
    isLast: boolean;
    disabled?: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    onClone: (value: TemplateValue) => void;
    title: React.ReactNode;
    description: string;
    icon: JSX.Element;
    actions?: JSX.Element;
    template: CmsDynamicZoneTemplate;
    children: React.ReactNode;
}

export const MultiValueItemContainer = makeDecoratable(
    "MultiValueItemContainer",
    ({ children, ...props }: MultiValueItemContainerProps) => {
        const actions = (
            <>
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<ArrowUpIcon />} content={"Move up"} />}
                    onClick={props.onMoveUp}
                    disabled={props.isFirst}
                />
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<ArrowDownIcon />} content={"Move down"} />}
                    onClick={props.onMoveDown}
                    disabled={props.isLast}
                />
                <Accordion.Item.Action.Separator />
                {props.actions ? <>{props.actions}</> : null}
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<CloneIcon />} content={"Duplicate"} />}
                    onClick={() => props.onClone(props.value)}
                />
                <Accordion.Item.Action
                    icon={<Tooltip trigger={<DeleteIcon />} content={"Delete"} />}
                    onClick={props.onDelete}
                />
            </>
        );

        return (
            <Accordion.Item
                title={props.title}
                description={props.description}
                icon={props.icon}
                actions={props.disabled ? null : actions}
            >
                {children}
            </Accordion.Item>
        );
    }
);

export interface MultiValueItemItemProps {
    template: CmsDynamicZoneTemplate;
    contentModel: CmsModel;
    Bind: BindComponent;
}

export const MultiValueItem = makeDecoratable(
    "MultiValueItem",
    (props: MultiValueItemItemProps) => {
        const { template, Bind, contentModel } = props;

        return (
            <TemplateProvider template={template}>
                <Fields
                    fields={template.fields}
                    layout={template.layout || []}
                    contentModel={contentModel}
                    Bind={Bind}
                />
            </TemplateProvider>
        );
    }
);

interface TemplateValue {
    _templateId: string;
    [key: string]: any;
}

interface TemplateValueFormProps {
    value: TemplateValue;
    contentModel: CmsModel;
    Bind: BindComponent;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    onClone: (value: TemplateValue) => void;
}

const TemplateValueForm = ({
    value,
    contentModel,
    Bind,
    isLast,
    isFirst,
    onMoveUp,
    onMoveDown,
    onDelete,
    onClone
}: TemplateValueFormProps) => {
    const { field } = useModelField();
    const rules = useFieldEffectiveRules(field);
    const disabled = !rules.canEdit || rules.disabled;
    const templates = field.settings?.templates || [];

    const template: CmsDynamicZoneTemplate | undefined = templates.find(
        tpl => tpl.id === value._templateId
    );

    if (!template) {
        return null;
    }

    return (
        <MultiValueItemContainer
            value={value}
            contentModel={contentModel}
            isFirst={isFirst}
            isLast={isLast}
            onClone={onClone}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            title={template.name}
            description={template.description}
            icon={<TemplateIcon icon={template.icon} />}
            template={template}
            disabled={disabled}
        >
            <MultiValueItem template={template} contentModel={contentModel} Bind={Bind} />
        </MultiValueItemContainer>
    );
};

export interface MultiValueContainerProps extends MultiValueDynamicZoneProps {
    children: React.ReactNode;
}

export const MultiValueContainer = makeDecoratable(
    "MultiValueContainer",
    ({ children }: MultiValueContainerProps) => {
        return (
            <Accordion variant={"container"} className={"gap-md"}>
                <>{children}</>
            </Accordion>
        );
    }
);

interface MultiValueDynamicZoneProps {
    // TODO: this prop might be useless, because we now have a `useModelField` hook.
    field: CmsModelField;
    bind: BindComponentRenderProp;
    contentModel: CmsModel;
    getBind: GetBind;
}

export const MultiValueDynamicZone = (props: MultiValueDynamicZoneProps) => {
    const { showConfirmation } = useConfirmationDialog({
        message: `Are you sure you want to delete this item? This action is not reversible.`,
        acceptLabel: `Yes, I'm sure!`,
        cancelLabel: `No, leave it.`
    });

    const { bind, getBind, contentModel } = props;
    const onTemplate = (template: CmsDynamicZoneTemplateWithTypename) => {
        bind.appendValue({ _templateId: template.id, __typename: template.__typename });
    };

    const cloneValue = (value: TemplateValue, index: number) => {
        bind.appendValue(cloneDeep(value), index + 1);
    };

    const values: TemplateValue[] = bind.value || [];
    const hasValues = values.length > 0;

    const Bind = getBind();

    return (
        <div className={"flex flex-col gap-y-lg"}>
            {hasValues ? (
                <ParentFieldProvider value={bind.value} path={Bind.parentName}>
                    <MultiValueContainer {...props}>
                        {values.map((value, index) => {
                            const Bind = getBind(index);

                            const onDelete = () => {
                                showConfirmation(() => {
                                    bind.removeValue(index);
                                });
                            };

                            return (
                                <ParentValueIndexProvider key={index} index={index}>
                                    <Bind>
                                        {() => (
                                            <Bind.ValidationContainer>
                                                <TemplateValueForm
                                                    value={value}
                                                    contentModel={contentModel}
                                                    Bind={Bind}
                                                    isFirst={index === 0}
                                                    isLast={index === values.length - 1}
                                                    onMoveUp={() => bind.moveValueUp(index)}
                                                    onMoveDown={() => bind.moveValueDown(index)}
                                                    onDelete={onDelete}
                                                    onClone={value => cloneValue(value, index)}
                                                />
                                            </Bind.ValidationContainer>
                                        )}
                                    </Bind>
                                </ParentValueIndexProvider>
                            );
                        })}
                    </MultiValueContainer>
                </ParentFieldProvider>
            ) : null}
            <CanEditField>
                <AddTemplateButton onTemplate={onTemplate} />
            </CanEditField>
        </div>
    );
};
