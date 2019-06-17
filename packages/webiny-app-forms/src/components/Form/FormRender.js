// @flow
// $FlowFixMe
import React, { useCallback, useEffect } from "react";
import { get, cloneDeep } from "lodash";
import { withCms } from "webiny-app-cms/context";
import { onFormMounted, saveFormSubmission } from "./functions";
import { withApollo } from "react-apollo";
import { compose } from "recompose";
import type { FormRenderPropsType, FormRenderComponentPropsType } from "webiny-app-forms/types";

const FormRender = compose(
    withCms(),
    withApollo
)((props: FormRenderComponentPropsType) => {
    const { data, cms } = props;

    if (!data) {
        // TODO: handle this
        return null;
    }

    const { layout, fields, settings } = data;

    useEffect(() => onFormMounted(props), []);

    const getFieldById = useCallback(id => {
        return fields.find(field => field.id === id);
    }, []);

    const getFieldByFieldId = useCallback(id => {
        return fields.find(field => field.fieldId === id);
    }, []);

    const getFields = useCallback(() => {
        const fields = cloneDeep(layout);
        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);
            });
        });
        return fields;
    }, []);

    const getDefaultValues = useCallback(() => {
        const values = {};
        fields.forEach(field => {
            if ("defaultValue" in field && typeof field.defaultValue !== "undefined") {
                values[field.fieldId] = field.defaultValue;
            }
        });
        return values;
    }, []);

    const submit = useCallback(data => saveFormSubmission(props, data), []);

    // Get form layout, defined in theme.
    let LayoutRenderComponent = get(cms, "theme.forms.layouts", []).find(
        item => item.name === settings.layout.renderer
    );

    if (!LayoutRenderComponent) {
        return <span>Cannot render form, layout missing.</span>;
    }

    LayoutRenderComponent = LayoutRenderComponent.component;

    const layoutProps: FormRenderPropsType = {
        getFieldById,
        getFieldByFieldId,
        getDefaultValues,
        getFields,
        submit,
        form: data
    };

    return <LayoutRenderComponent {...layoutProps} />;
});

export default FormRender;
