// @flow
// $FlowFixMe
import React, { useEffect } from "react";
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

    useEffect(() => onFormMounted(props), [data.id]);

    const getFieldById = id => {
        return fields.find(field => field._id === id);
    };

    const getFieldByFieldId = id => {
        return fields.find(field => field.fieldId === id);
    };

    const getFields = () => {
        const fields = cloneDeep(layout);
        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);
            });
        });
        return fields;
    };

    const getDefaultValues = (overrides = {}) => {
        const values = {};
        fields.forEach(field => {
            if (
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[field.fieldId] = field.settings.defaultValue;
            }
        });
        return { ...values, ...overrides };
    };

    const submit = async data => {
        const formSubmission = await createFormSubmission({ props, data });
        await handleFormTriggers({ props, data, formSubmission });
        return formSubmission;
    };

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
