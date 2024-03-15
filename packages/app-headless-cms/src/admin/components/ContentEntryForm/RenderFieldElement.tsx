import React from "react";
import get from "lodash/get";
import { makeDecoratable } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { CmsModelField, CmsEditorContentModel, BindComponent } from "~/types";
import Label from "./Label";
import { useBind } from "./useBind";
import { useRenderPlugins } from "./useRenderPlugins";
import { ModelFieldProvider } from "../ModelFieldProvider";
import { useParentField } from "./ParentValue";

const t = i18n.ns("app-headless-cms/admin/components/content-form");

export interface RenderFieldElementProps {
    field: CmsModelField;
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
}

export const RenderFieldElement = makeDecoratable(
    "RenderFieldElement",
    (props: RenderFieldElementProps) => {
        const renderPlugins = useRenderPlugins();
        const { field, Bind, contentModel } = props;
        const getBind = useBind({ Bind, field });
        const parent = useParentField();
        const fieldPath = [Bind.parentName, field.fieldId].filter(Boolean).join(".");

        const printParent = (level = 0) => {
            if (!parent) {
                return;
            }

            console.log(
                `${fieldPath}, parent ${level} =>`,
                level === 0 ? parent.value : parent.getParentValue(level - 1)
            );
        };

        if (typeof field.renderer === "function") {
            return (
                <ModelFieldProvider field={field}>
                    {field.renderer({ field, getBind, Label, contentModel })}
                </ModelFieldProvider>
            );
        }

        const renderPlugin = renderPlugins.find(
            plugin => plugin.renderer.rendererName === get(field, "renderer.name")
        );

        if (!renderPlugin) {
            return t`Cannot render "{fieldName}" field - field renderer missing.`({
                fieldName: <strong>{field.fieldId}</strong>
            });
        }

        return (
            <ModelFieldProvider field={field}>
                <span>
                    Element&lt;{fieldPath}&gt; Parents:&nbsp;
                    {fieldPath.split(".").map((_, index) => {
                        return (
                            <>
                                <a key={index} onClick={() => printParent(index)}>
                                    {index}
                                </a>
                                ,{" "}
                            </>
                        );
                    })}
                </span>
                {renderPlugin.renderer.render({ field, getBind, Label, contentModel })}
            </ModelFieldProvider>
        );
    }
);
