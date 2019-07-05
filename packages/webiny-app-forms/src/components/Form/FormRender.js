// @flow
// $FlowFixMe
import React, { useCallback, useEffect } from "react";
import { get, cloneDeep } from "lodash";
import { withCms } from "webiny-app-cms/context";
import { onFormMounted, createFormSubmission, handleFormTriggers } from "./functions";
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
        return fields.find(field => field._id === id);
    }, [data.id]);

    const getFieldByFieldId = useCallback(id => {
        return fields.find(field => field.fieldId === id);
    }, [data.id]);

    const getFields = useCallback(() => {
        const fields = cloneDeep(layout);
        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);
            });
        });
        return fields;
    }, [data.id]);

    const getDefaultValues = useCallback((overrides = {}) => {
        const values = {};
        fields.forEach(field => {
            if ("defaultValue" in field.settings && typeof field.settings.defaultValue !== "undefined") {
                values[field.fieldId] = field.defaultValue;
            } else {
                values[field.fieldId] = ""; // TODO: fix this "", must be read from plugin
            }
        });
        return { ...values, ...overrides };
    }, [data.id]);

    const submit = useCallback(async data => {
        const formSubmission = await createFormSubmission({ props, data });
        await handleFormTriggers({ props, data, formSubmission });
        return formSubmission;
    }, [data.id]);

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

    console.log("dobeo layoutprops", layoutProps.form.fields);
    return <LayoutRenderComponent {...layoutProps} />;
});

export default FormRender;
