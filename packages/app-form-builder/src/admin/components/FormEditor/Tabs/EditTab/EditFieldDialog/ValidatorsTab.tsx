// TODO @ts-refactor figure out correct types.
// @ts-nocheck
import React, { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { Switch } from "@webiny/ui/Switch";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useFormEditor } from "../../../Context";
import { Form } from "@webiny/form";
import { cloneDeep, debounce } from "lodash";
import { FormRenderPropParams } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { FbBuilderFormFieldValidatorPlugin, FbFormModelField } from "~/types";

interface OnEnabledChangeParams {
    data: Record<string, string>;
    validationValue: string;
    onChangeValidation: string;
    validator: string;
}
const onEnabledChange = ({
    data,
    validationValue,
    onChangeValidation,
    validator
}: OnEnabledChangeParams): void => {
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

interface OnFormChangeParams {
    data: Record<string, string>;
    validationValue: Record<string, any>;
    onChangeValidation: (value: Record<string, any>) => void;
    validatorIndex: number;
}

const onFormChange = debounce(
    ({ data, validationValue, onChangeValidation, validatorIndex }: OnFormChangeParams) => {
        const newValidationValue = cloneDeep(validationValue);
        newValidationValue[validatorIndex] = {
            ...newValidationValue[validatorIndex],
            ...cloneDeep(data)
        };
        onChangeValidation(newValidationValue);
    },
    200
);

interface ValidatorsTabProps {
    field: FbFormModelField;
    form: FormRenderPropParams;
}
const ValidatorsTab: React.FC<ValidatorsTabProps> = props => {
    const { getFieldPlugin } = useFormEditor();
    const { field, form } = props;
    const { Bind, data: formFieldData } = form;

    const fieldPlugin = getFieldPlugin({ name: field.name });

    const validators = useMemo(() => {
        return plugins
            .byType<FbBuilderFormFieldValidatorPlugin>("form-editor-field-validator")
            .map(plugin => plugin.validator)
            .map(validator => {
                if (fieldPlugin.field.validators.includes(validator.name)) {
                    return { optional: true, validator };
                } else if (fieldPlugin.field.validators.includes(`!${validator.name}`)) {
                    return { optional: false, validator };
                }
                return null;
            })
            .filter(Boolean)
            .sort((a, b) => {
                if (!a.optional && b.optional) {
                    return -1;
                }

                if (a.optional && !b.optional) {
                    return 1;
                }

                return 0;
            });
    }, []);

    return (
        <Bind name={"validation"}>
            {({ value: validationValue, onChange: onChangeValidation }) =>
                validators.map(({ optional, validator }) => {
                    const validatorIndex = validationValue.findIndex(
                        item => item.name === validator.name
                    );
                    const data = validationValue[validatorIndex];

                    return (
                        <SimpleForm key={validator.name}>
                            {/*TODO: @ts-adrian nema descriptiona?*/}
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
                                                    {/*TODO: @ts-adrian kako ovo?*/}
                                                    <Bind
                                                        name={"message"}
                                                        validators={validation.create("required")}
                                                    >
                                                        <Input
                                                            label={"Message"}
                                                            description={
                                                                "This message will be displayed to the user"
                                                            }
                                                        />
                                                    </Bind>
                                                </Cell>
                                            </Grid>

                                            {typeof validator.renderSettings === "function" &&
                                                validator.renderSettings({
                                                    setValue,
                                                    setMessage: message => {
                                                        setValue("message", message);
                                                    },
                                                    data,
                                                    Bind,
                                                    formFieldData
                                                })}
                                        </SimpleFormContent>
                                    )}
                                </Form>
                            )}
                        </SimpleForm>
                    );
                })
            }
        </Bind>
    );
};

export default ValidatorsTab;
