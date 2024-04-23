import React from "react";
import get from "lodash/get";
import { makeDecoratable } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { CmsModelField, CmsEditorContentModel, BindComponent } from "~/types";
import Label from "./Label";
import { useBind } from "./useBind";
import { useRenderPlugins } from "./useRenderPlugins";
import { ModelFieldProvider, useModelField } from "../ModelFieldProvider";

const t = i18n.ns("app-headless-cms/admin/components/content-form");

type RenderFieldProps = Omit<FieldElementProps, "field">;

const RenderField = (props: RenderFieldProps) => {
    const renderPlugins = useRenderPlugins();
    const { Bind, contentModel } = props;
    const { field } = useModelField();
    const getBind = useBind({ Bind, field });

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
        return (
            <ModelFieldProvider field={field}>
                <RenderField {...props} />
            </ModelFieldProvider>
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
