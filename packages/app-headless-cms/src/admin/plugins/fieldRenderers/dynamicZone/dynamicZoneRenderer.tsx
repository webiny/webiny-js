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

export type DynamicZoneContainerProps = {
    field: CmsModelField;
    getBind: (index?: number, key?: string) => BindComponent;
    contentModel: CmsModel;
    bind: BindComponentRenderProp;
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
};

export const DynamicZoneContainer = makeComposable<DynamicZoneContainerProps>(
    "DynamicZoneContainer",
    props => {
        const {
            field,
            bind: {
                validation: { isValid, message }
            },
            title = field.label,
            description = field.helpText,
            className,
            children
        } = props;

        const defaultClassName = field.multipleValues ? noBottomPadding : undefined;

        return (
            <>
                <Accordion>
                    <AccordionItem
                        title={title}
                        description={description}
                        className={className || defaultClassName}
                    >
                        {children}
                    </AccordionItem>
                </Accordion>
                {isValid === false && (
                    <FormElementMessage error={true}>{message}</FormElementMessage>
                )}
            </>
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

    const Bind = getBind();

    const Component = field.multipleValues ? MultiValueDynamicZone : SingleValueDynamicZone;

    return (
        <Bind>
            {bind => {
                return (
                    <DynamicZoneContainer
                        field={field}
                        bind={bind}
                        getBind={getBind}
                        contentModel={contentModel}
                    >
                        <Component
                            bind={bind}
                            field={field}
                            getBind={getBind}
                            contentModel={contentModel}
                        />
                    </DynamicZoneContainer>
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
