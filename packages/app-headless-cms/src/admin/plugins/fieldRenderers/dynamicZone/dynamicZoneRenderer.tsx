import React from "react";
import { css } from "emotion";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import {
    BindComponent,
    BindComponentRenderProp,
    CmsModel,
    CmsModelField,
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "~/types";
import { SingleValueDynamicZone } from "./SingleValueDynamicZone";
import { MultiValueDynamicZone } from "./MultiValueDynamicZone";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { makeComposable } from "@webiny/react-composition";

const noBottomPadding = css`
    > .webiny-ui-accordion-item__content {
        padding-bottom: 0 !important;
    }
`;

export interface DynamicZoneContentItemProps {
    field: CmsModelField;
    getBind: (index?: number, key?: string) => BindComponent;
    contentModel: CmsModel;
    Component: React.ComponentType<any>;
    bind: BindComponentRenderProp;
    isMultipleValues: boolean;
    title?: string;
}

export const DynamicZoneContentItem = makeComposable<DynamicZoneContentItemProps>(
    "DynamicZoneContentItem",
    props => {
        const { field, title, isMultipleValues, getBind, contentModel, Component, bind } = props;
        return (
            <AccordionItem
                title={title || field.label}
                description={field.helpText}
                className={isMultipleValues ? noBottomPadding : undefined}
            >
                <Component
                    bind={bind}
                    field={field}
                    getBind={getBind}
                    contentModel={contentModel}
                />
            </AccordionItem>
        );
    }
);

const DynamicZoneContent = ({
    field,
    getBind,
    contentModel
}: CmsModelFieldRendererProps) => {
    const templates = field.settings?.templates || [];
    if (!templates.length) {
        console.info(
            `Skipping "${field.fieldId}" field. There are no templates defined for this dynamic zone.`
        );
        return null;
    }

    const isMultipleValues = field.multipleValues === true;
    const Bind = getBind();

    const Component = isMultipleValues ? MultiValueDynamicZone : SingleValueDynamicZone;

    return (
        <Bind>
            {bind => {
                const { isValid, message } = bind.validation;
                return (
                    <>
                        <Accordion>
                            <DynamicZoneContentItem
                                field={field}
                                bind={bind}
                                getBind={getBind}
                                contentModel={contentModel}
                                Component={Component}
                                isMultipleValues={isMultipleValues}
                            />
                        </Accordion>
                        {isValid === false && (
                            <FormElementMessage error={true}>{message}</FormElementMessage>
                        )}
                    </>
                );
            }}
        </Bind>
    );
};

export const dynamicZoneFieldRenderer: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-dynamic-zone",
    renderer: {
        rendererName: "dynamicZone",
        name: "Dynamic Zone",
        description: "Renders a dynamic zone.",
        canUse({ field }) {
            return field.type === "dynamicZone";
        },
        render(props) {
            return <DynamicZoneContent {...props} />;
        }
    }
};
