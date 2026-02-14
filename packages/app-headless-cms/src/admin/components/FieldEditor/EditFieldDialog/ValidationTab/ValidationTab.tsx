import React from "react";
import { ValidationsSection } from "~/admin/components/FieldEditor/EditFieldDialog/ValidationTab/ValidationsSection.js";
import {
    getFieldValidators,
    getListValidators
} from "~/admin/components/FieldEditor/EditFieldDialog/getValidators.js";
import { useModelField } from "~/admin/components/ModelFieldProvider/index.js";
import { ValidatorsList } from "~/admin/components/FieldEditor/EditFieldDialog/ValidationTab/ValidatorsList.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

interface ValidationTabProps {
    field: CmsModelField;
}

export const ValidationTab = ({ field }: ValidationTabProps) => {
    const { fieldPlugin } = useModelField();

    const individualValidation = getFieldValidators(field, fieldPlugin);
    const hasValidators = individualValidation.validators.length > 0;
    const listValidation = getListValidators(field, fieldPlugin);

    return (
        <>
            {field.list ? (
                <>
                    <ValidationsSection
                        validators={listValidation.validators}
                        fieldKey={"listValidators"}
                        title={listValidation.title || "List validators"}
                        description={
                            listValidation.description ||
                            "These validators are applied to the entire list of values."
                        }
                    />

                    {hasValidators ? (
                        <ValidationsSection
                            fieldKey={"validators"}
                            validators={individualValidation.validators}
                            title={individualValidation.title || "Individual value validators"}
                            description={
                                individualValidation.description ||
                                "These validators are applied to each value in the list."
                            }
                        />
                    ) : null}
                </>
            ) : null}

            {!field.list && hasValidators ? (
                <ValidatorsList name={"validation"} validators={individualValidation.validators} />
            ) : null}
        </>
    );
};
