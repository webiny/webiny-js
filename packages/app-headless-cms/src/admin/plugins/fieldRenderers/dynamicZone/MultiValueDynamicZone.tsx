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
import { useModelField } from "~/admin/hooks";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import {
    BindComponent,
    BindComponentRenderProp,
    CmsDynamicZoneTemplate,
    CmsModelFieldRendererProps,
    CmsModel,
    CmsModelField
} from "~/types";
import { makeDecoratable } from "@webiny/react-composition";

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
    onClone: () => void;
    title: React.ReactNode;
    description: string;
    icon: JSX.Element;
    actions: JSX.Element;
    template: CmsDynamicZoneTemplate;
    children: React.ReactNode;
}

export const MultiValueItemContainer = makeDecoratable(
    "MultiValueItemContainer",
    ({ title, description, icon, actions, children }: MultiValueItemContainerProps) => {
        return (
            <AccordionItem title={title} description={description} icon={icon} actions={actions}>
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
            <Fields
                fields={template.fields}
                layout={template.layout || []}
                contentModel={contentModel}
                Bind={Bind}
            />
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
    onClone: () => void;
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
            onClone={onClone}
            isFirst={isFirst}
            isLast={isLast}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            title={template.name}
            description={template.description}
            icon={<TemplateIcon icon={template.icon} />}
            template={template}
            actions={
                <AccordionItem.Actions>
                    <AccordionItem.Action
                        icon={<ArrowUpIcon />}
                        onClick={onMoveUp}
                        disabled={isFirst}
                    />
                    <AccordionItem.Action
                        icon={<ArrowDownIcon />}
                        onClick={onMoveDown}
                        disabled={isLast}
                    />
                    <AccordionItem.Divider />
                    <AccordionItem.Action icon={<CloneIcon />} onClick={onClone} />
                    <AccordionItem.Action icon={<DeleteIcon />} onClick={onDelete} />
                </AccordionItem.Actions>
            }
        >
            <MultiValueItem template={template} contentModel={contentModel} Bind={Bind} />
        </MultiValueItemContainer>
    );
};

export interface MultiValueContainerProps extends MultiValueDynamicZoneProps {
    children: React.ReactNode;
}

export const MultiValueContainer = makeDecoratable<
    React.FunctionComponent<MultiValueContainerProps>
>("MultiValueContainer", ({ children }) => {
    return (
        <Accordion>
            <>{children}</>
        </Accordion>
    );
});

interface MultiValueDynamicZoneProps {
    // TODO: this prop might be useless, because we now have a `useModelField` hook.
    field: CmsModelField;
    bind: BindComponentRenderProp;
    contentModel: CmsModel;
    getBind: GetBind;
}

export const MultiValueDynamicZone = (props: MultiValueDynamicZoneProps) => {
    const { bind, getBind, contentModel } = props;
    const onTemplate = (template: CmsDynamicZoneTemplate) => {
        bind.appendValue({ _templateId: template.id });
    };

    const cloneValue = (index: number) => {
        const newValue = cloneDeep(bind.value[index]);
        bind.appendValue(newValue, index + 1);
    };

    const values: TemplateValue[] = bind.value || [];
    const hasValues = values.length > 0;

    return (
        <>
            {hasValues ? (
                <MultiValueContainer {...props}>
                    {values.map((value, index) => (
                        <TemplateValueForm
                            key={index}
                            value={value}
                            contentModel={contentModel}
                            Bind={getBind(index)}
                            isFirst={index === 0}
                            isLast={index === values.length - 1}
                            onMoveUp={() => bind.moveValueUp(index)}
                            onMoveDown={() => bind.moveValueDown(index)}
                            onDelete={() => bind.removeValue(index)}
                            onClone={() => cloneValue(index)}
                        />
                    ))}
                </MultiValueContainer>
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
