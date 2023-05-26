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
} from "@webiny/app-headless-cms-common/types";

const BottomMargin = styled.div`
    margin-bottom: 20px;
`;

type GetBind = CmsModelFieldRendererProps["getBind"];

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

const TemplateValueForm: React.VFC<TemplateValueFormProps> = ({
    value,
    contentModel,
    Bind,
    isLast,
    isFirst,
    onMoveUp,
    onMoveDown,
    onDelete,
    onClone
}) => {
    const { field } = useModelField();
    const templates = field.settings?.templates || [];

    const template: CmsDynamicZoneTemplate | undefined = templates.find(
        tpl => tpl.id === value._templateId
    );

    if (!template) {
        return null;
    }

    return (
        <AccordionItem
            title={template.name}
            description={template.description}
            icon={<TemplateIcon icon={template.icon} />}
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
            <Fields
                fields={template.fields}
                layout={template.layout || []}
                contentModel={contentModel}
                Bind={Bind}
            />
        </AccordionItem>
    );
};

interface MultiValueDynamicZoneProps {
    field: CmsModelField;
    bind: BindComponentRenderProp;
    contentModel: CmsModel;
    getBind: GetBind;
}

export const MultiValueDynamicZone: React.VFC<MultiValueDynamicZoneProps> = ({
    bind,
    getBind,
    contentModel
}) => {
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
                <Accordion>
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
                </Accordion>
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
