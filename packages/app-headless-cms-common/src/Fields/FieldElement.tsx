import React from "react";
import get from "lodash/get.js";
import { makeDecoratable } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import Label from "./Label.js";
import { useBind } from "./useBind.js";
import { useRenderPlugins } from "./useRenderPlugins.js";
import { ModelFieldProvider, useModelField } from "../ModelFieldProvider/index.js";
import type { BindComponent, CmsEditorContentModel, CmsModelField } from "~/types/index.js";
import { ErrorBoundary } from "./ErrorBoundary.js";

const t = i18n.ns("app-headless-cms/admin/components/content-form");

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "hcms-model-field": {
                "data-id": string;
                "data-type": string;
                "data-field-id": string;
                children: React.ReactNode;
            };
        }
    }
}

type RenderFieldProps = Omit<FieldElementProps, "field">;

const RenderField = (props: RenderFieldProps) => {
    const renderPlugins = useRenderPlugins();
    const { Bind, contentModel } = props;
    const { field } = useModelField();
    const getBind = useBind({ Bind });

    if (typeof field.renderer === "function") {
        return <>{field.renderer({ field, getBind, Label, contentModel })}</>;
    }

    const renderPlugin = renderPlugins.find(
        plugin => plugin.renderer.rendererName === get(field, "renderer.name")
    );

    if (!renderPlugin) {
        return t`Cannot render "{fieldName}" field - field renderer missing.`({
            fieldName: <strong>{field.fieldId}</strong>
        });
    }

    return <>{renderPlugin.renderer.render({ field, getBind, Label, contentModel })}</>;
};

export interface FieldElementProps {
    field: CmsModelField;
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
}

export const FieldElement = makeDecoratable(
    "FieldElement",
    ({ field, ...props }: FieldElementProps) => {
        if (!field) {
            return null;
        }

        return (
            <hcms-model-field
                data-id={field.id}
                data-field-id={field.fieldId}
                data-type={field.type}
            >
                <ErrorBoundary field={field}>
                    <ModelFieldProvider field={field}>
                        <RenderField {...props} />
                    </ModelFieldProvider>
                </ErrorBoundary>
            </hcms-model-field>
        );
    }
);

/**
 * @deprecated Use `FieldElement` instead.
 */
export const RenderFieldElement = FieldElement;

/**
 * @deprecated Use `FieldElementProps` instead.
 */
export type RenderFieldElementProps = FieldElementProps;
