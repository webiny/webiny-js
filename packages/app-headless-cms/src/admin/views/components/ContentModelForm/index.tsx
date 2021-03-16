import React from "react";
import { cloneDeep, pick } from "lodash";
import { ContentFormRender } from "./ContentFormRender";
import { CmsContentModelFormProps } from "~/types";

export const ContentModelForm: React.FC<CmsContentModelFormProps> = props => {
    const { contentModel: contentModelRaw } = props;

    const contentModel = cloneDeep(contentModelRaw);
    const { layout, fields } = contentModel;

    const getFieldById = id => {
        return fields.find(field => field.id === id);
    };

    const getFields = () => {
        let returnFields = [];
        if (layout) {
            returnFields = cloneDeep(layout);
        } else {
            // If no layout provided, just render all fields one below other.
            returnFields = [...fields.map(item => [item.id])];
        }

        returnFields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);
            });
        });

        return returnFields;
    };

    const getDefaultValues = (overrides = {}) => {
        const values = {};
        // TODO: finish default values.
        /*fields.forEach(field => {
            const fieldId = field.fieldId;

            if (
                fieldId &&
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[fieldId] = field.settings.defaultValue;
            }
        });*/
        return { ...values, ...overrides };
    };

    const { entry, onSubmit, onChange, onForm, invalidFields } = props;

    return (
        <ContentFormRender
            onForm={onForm}
            getFields={getFields}
            getDefaultValues={getDefaultValues}
            entry={entry}
            contentModel={contentModel}
            onChange={onChange}
            onSubmit={async (data, form) => {
                const fieldsIds = contentModel.fields.map(item => item.fieldId);
                return onSubmit(pick(data, [...fieldsIds]), form);
            }}
            invalidFields={invalidFields}
        />
    );
};
