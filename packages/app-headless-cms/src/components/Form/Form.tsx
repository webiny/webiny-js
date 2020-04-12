import { I18NValue } from "@webiny/app-i18n/components";
import { getPlugins } from "@webiny/plugins";
import { cloneDeep } from "lodash";
import React from "react";
import LayoutRenderComponent from "./LayoutRenderComponent/DefaultFormLayout";
import { createFormSubmission } from "./functions";
import { useApolloClient } from "@webiny/app-headless-cms/admin/hooks";

import {
    FormRenderPropsType,
    FbFormRenderComponentProps,
    FormSubmitResponseType,
    CmsContentModelModel,
    FbFormSubmissionData,
    CmsFormFieldValidatorPlugin
} from "@webiny/app-headless-cms/types";

const Form = (props: FbFormRenderComponentProps) => {
    const client = useApolloClient();
    const data = props.data || ({} as CmsContentModelModel);

    if (!data.id) {
        return null;
    }

    const formData: CmsContentModelModel = cloneDeep(data);
    const { layout, fields } = formData;

    const getFieldById = id => {
        return fields.find(field => field._id === id);
    };

    const getFieldByFieldId = id => {
        return fields.find(field => field.fieldId === id);
    };

    const getFields = () => {
        const fields: any = cloneDeep(layout);
        const validatorPlugins = getPlugins<CmsFormFieldValidatorPlugin>("form-field-validator");

        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);
                row[idIndex].validators = row[idIndex].validation
                    .map(item => {
                        const validatorPlugin = validatorPlugins.find(
                            plugin => plugin.validator.name === item.name
                        );

                        if (
                            !validatorPlugin ||
                            typeof validatorPlugin.validator.validate !== "function"
                        ) {
                            return;
                        }

                        return async value => {
                            let isInvalid = true;
                            try {
                                const result = await validatorPlugin.validator.validate(
                                    value,
                                    item
                                );
                                isInvalid = result === false;
                            } catch (e) {
                                isInvalid = true;
                            }

                            if (isInvalid) {
                                throw new Error(
                                    I18NValue({ value: item.message }) || "Invalid value."
                                );
                            }
                        };
                    })
                    .filter(Boolean);
            });
        });
        return fields;
    };

    const getDefaultValues = (overrides = {}) => {
        const values = {};
        fields.forEach(field => {
            const fieldId = field.fieldId;

            if (
                fieldId &&
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[fieldId] = field.settings.defaultValue;
            }
        });
        return { ...values, ...overrides };
    };

    const submit = async (data: FbFormSubmissionData): Promise<FormSubmitResponseType> => {
        return createFormSubmission({
            client,
            props,
            data
        });
    };

    const layoutProps: FormRenderPropsType = {
        getFieldById,
        getFieldByFieldId,
        getDefaultValues,
        getFields,
        submit,
        formData
    };

    return <LayoutRenderComponent {...layoutProps} />;
};

export default Form;
