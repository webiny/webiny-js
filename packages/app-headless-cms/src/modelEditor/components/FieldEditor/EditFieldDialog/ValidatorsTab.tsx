import React from "react";
import { css } from "emotion";
import { cloneDeep, debounce } from "lodash";
import { Switch } from "@webiny/ui/Switch";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Form, FormRenderPropParams } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import {
    CmsEditorField,
    CmsEditorFieldValidator,
    CmsEditorFieldValidatorPlugin,
    CmsEditorFieldValidatorPluginValidator
} from "~/types";
import { Validator } from "@webiny/validation/types";

interface OnChangeValidationCallable {
    (validators: CmsEditorFieldValidator[]): void;
}
interface OnEnabledChangeParams {
    data: CmsEditorFieldValidator;
    validationValue: CmsEditorFieldValidator[];
    onChangeValidation: OnChangeValidationCallable;
    validator: CmsEditorFieldValidatorPluginValidator;
}
const onEnabledChange = (params: OnEnabledChangeParams): void => {
    const { data, validationValue, onChangeValidation, validator } = params;
    if (data) {
        const index = validationValue.findIndex(item => item.name === validator.name);
        onChangeValidation([
            ...validationValue.slice(0, index),
            ...validationValue.slice(index + 1)
        ]);
        return;
    }
    onChangeValidation([
        ...validationValue,
        {
            name: validator.name,
            settings: validator.defaultSettings,
            message: validator.defaultMessage
        }
    ]);
};

const onFormChange = debounce(({ data, validationValue, onChangeValidation, validatorIndex }) => {
    const newValidationValue = cloneDeep(validationValue);
    newValidationValue[validatorIndex] = {
        ...newValidationValue[validatorIndex],
        ...cloneDeep(data)
    };
    onChangeValidation(newValidationValue);
}, 200);

const noMargin = css({
    margin: "0 !important"
});

interface ValidatorsTabPropsValidator {
    optional: boolean;
    validator: CmsEditorFieldValidatorPlugin["validator"];
}
interface ValidatorsTabProps {
    name: string;
    validators: ValidatorsTabPropsValidator[];
    form: FormRenderPropParams;
    field: CmsEditorField;
}

const ValidatorsTab: React.FC<ValidatorsTabProps> = props => {
    const {
        field,
        name,
        validators,
        form: { Bind }
    } = props;

    return (
        <Bind name={name} defaultValue={[]}>
            {bind => {
                const { value: validationValue, onChange: onChangeValidation } = bind;
                return (
                    <>
                        {validators.map(({ optional, validator }) => {
                            const validatorIndex = (
                                (validationValue || []) as Validator[]
                            ).findIndex(item => item.name === validator.name);
                            const data = (validationValue || [])[validatorIndex];

                            return (
                                <SimpleForm
                                    key={validator.name}
                                    noElevation
                                    className={noMargin}
                                    data-testid={`cms.editor.field-validator.${validator.name}`}
                                >
                                    <SimpleFormHeader title={validator.label}>
                                        {optional && (
                                            <Switch
                                                label="Enabled"
                                                value={validatorIndex >= 0}
                                                onChange={() =>
                                                    onEnabledChange({
                                                        data,
                                                        validationValue,
                                                        onChangeValidation,
                                                        validator
                                                    })
                                                }
                                            />
                                        )}
                                    </SimpleFormHeader>
                                    {data && (
                                        <Form
                                            data={data}
                                            onChange={data =>
                                                onFormChange({
                                                    data,
                                                    validationValue,
                                                    onChangeValidation,
                                                    validatorIndex
                                                })
                                            }
                                        >
                                            {({ Bind, setValue }) => (
                                                <SimpleFormContent>
                                                    <Grid>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"message"}
                                                                validators={validation.create(
                                                                    "required"
                                                                )}
                                                            >
                                                                {bind => {
                                                                    return (
                                                                        <Input
                                                                            {...bind}
                                                                            label={"Message"}
                                                                            data-testid="cms.editfield.validators.required"
                                                                            description={
                                                                                "This message will be displayed to the user"
                                                                            }
                                                                        />
                                                                    );
                                                                }}
                                                            </Bind>
                                                        </Cell>
                                                    </Grid>

                                                    {typeof validator.renderSettings ===
                                                        "function" &&
                                                        validator.renderSettings({
                                                            field,
                                                            setValue,
                                                            setMessage: (message: string) => {
                                                                setValue("message", message);
                                                            },
                                                            data,
                                                            /**
                                                             * TODO @ts-refactor
                                                             * Figure out type for Bind.
                                                             */
                                                            Bind: Bind as any
                                                        })}
                                                </SimpleFormContent>
                                            )}
                                        </Form>
                                    )}
                                </SimpleForm>
                            );
                        })}
                    </>
                );
            }}
        </Bind>
    );
};

export default ValidatorsTab;
