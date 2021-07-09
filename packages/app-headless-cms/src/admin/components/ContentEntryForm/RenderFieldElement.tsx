import React from "react";
import { CmsEditorField, CmsEditorContentModel } from "~/types";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import Label from "./Label";
import { BindComponent } from "@webiny/form";
import { useBind } from "./useBind";
import { useRenderPlugins } from "./useRenderPlugins";

const t = i18n.ns("app-headless-cms/admin/components/content-form");

const RenderFieldElement = (props: {
    field: CmsEditorField;
    Bind: BindComponent;
    contentModel: CmsEditorContentModel;
}) => {
    const renderPlugins = useRenderPlugins();
    const { field, Bind, contentModel } = props;
    const getBind = useBind({ Bind, field });

    const renderPlugin = renderPlugins.find(
        plugin => plugin.renderer.rendererName === get(field, "renderer.name")
    );

    if (!renderPlugin) {
        return t`Cannot render "{fieldName}" field - field renderer missing.`({
            fieldName: <strong>{field.fieldId}</strong>
        });
    }

    return renderPlugin.renderer.render({ field, getBind, Label, contentModel });
};

export default RenderFieldElement;
