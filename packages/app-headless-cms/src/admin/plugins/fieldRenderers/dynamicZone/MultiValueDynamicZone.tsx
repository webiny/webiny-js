import React from "react";
import styled from "@emotion/styled";
import cloneDeep from "lodash/cloneDeep";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { ReactComponent as CloneIcon } from "@material-design-icons/svg/outlined/library_add.svg";
import { ReactComponent as ArrowUpIcon } from "@material-design-icons/svg/round/expand_less.svg";
import { ReactComponent as ArrowDownIcon } from "@material-design-icons/svg/round/expand_more.svg";
import { AddTemplateButton, AddTemplateIcon } from "./AddTemplate";
import { TemplateIcon } from "./TemplateIcon";
import { ParentFieldProvider, useModelField } from "~/admin/hooks";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import {
    BindComponent,
    BindComponentRenderProp,
    CmsDynamicZoneTemplate,
    CmsModelFieldRendererProps,
    CmsModel,
    CmsModelField,
    CmsDynamicZoneTemplateWithTypename
} from "~/types";
import { makeDecoratable } from "@webiny/react-composition";
import { TemplateProvider } from "~/admin/plugins/fieldRenderers/dynamicZone/TemplateProvider";
import { ParentValueIndexProvider } from "~/admin/components/ModelFieldProvider";

const BottomMargin = styled.div`
    margin-bottom: 20px;
`;

type GetBind = CmsModelFieldRendererProps["getBind"];

export interface MultiValueItemContainerProps {
    value: TemplateValue;
    contentModel: CmsModel;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    onClone: (value: TemplateValue) => void;
    title: React.ReactNode;
    description: string;
    icon: JSX.Element;
    template: CmsDynamicZoneTemplate;
    children: React.ReactNode;
}

export const MultiValueItemContainer = makeDecoratable(
    "MultiValueItemContainer",
    ({ children, ...props }: MultiValueItemContainerProps) => {
        const actions = (
            <AccordionItem.Actions>
                <AccordionItem.Action
                    icon={<ArrowUpIcon />}
                    onClick={props.onMoveUp}
                    disabled={props.isFirst}
                />
                <AccordionItem.Action
                    icon={<ArrowDownIcon />}
                    onClick={props.onMoveDown}
                    disabled={props.isLast}
                />
                <AccordionItem.Divider />
                <AccordionItem.Action
                    icon={<CloneIcon />}
                    onClick={() => props.onClone(props.value)}
                />
                <AccordionItem.Action icon={<DeleteIcon />} onClick={props.onDelete} />
            </AccordionItem.Actions>
        );

        return (
            <AccordionItem
                title={props.title}
                description={props.description}
                icon={props.icon}
                actions={actions}
            >
                {children}
            </AccordionItem>
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
            <Accordion>
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
        <>
            {hasValues ? (
                <ParentFieldProvider value={bind.value} path={Bind.parentName}>
                    <MultiValueContainer {...props}>
                        {values.map((value, index) => {
                            const Bind = getBind(index);

                            return (
                                <ParentValueIndexProvider key={index} index={index}>
                                    <TemplateValueForm
                                        value={value}
                                        contentModel={contentModel}
                                        Bind={Bind}
                                        isFirst={index === 0}
                                        isLast={index === values.length - 1}
                                        onMoveUp={() => bind.moveValueUp(index)}
                                        onMoveDown={() => bind.moveValueDown(index)}
                                        onDelete={() => bind.removeValue(index)}
                                        onClone={value => cloneValue(value, index)}
                                    />
                                </ParentValueIndexProvider>
                            );
                        })}
                    </MultiValueContainer>
                </ParentFieldProvider>
            ) : null}
            {hasValues ? (
                <AddTemplateIcon onTemplate={onTemplate} />
            ) : (
                <BottomMargin>
                    <AddTemplateButton onTemplate={onTemplate} />
                </BottomMargin>
            )}
        </>
    );
};
