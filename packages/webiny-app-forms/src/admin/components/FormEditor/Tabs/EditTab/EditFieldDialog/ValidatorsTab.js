import React, { useMemo } from "react";
import { getPlugins } from "webiny-plugins";
import { Switch } from "webiny-ui/Switch";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-admin/components/SimpleForm";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { Form } from "webiny-form";
import { cloneDeep, debounce } from "lodash";

const onFormChange = debounce(({ data, validationValue, onChangeValidation, validatorIndex }) => {
    const newValidationValue = cloneDeep(validationValue);
    newValidationValue[validatorIndex] = {
        ...newValidationValue[validatorIndex],
        ...cloneDeep(data)
    };
    onChangeValidation(newValidationValue);
}, 200);

const onEnabledChange = ({ data, validationValue, onChangeValidation, validator }) => {
    if (data) {
        const index = validationValue.findIndex(item => item.name === validator.name);
        onChangeValidation([
            ...validationValue.slice(0, index),
            ...validationValue.slice(index + 1)
        ]);
    } else {
        onChangeValidation([...validationValue, { name: validator.name }]);
    }
};

const ValidatorsTab = props => {
    const { field, form } = props;
    const { getFieldPlugin } = useFormEditor();

    const fieldType = getFieldPlugin({ name: field.name });

    const validators = useMemo(() => {
        return getPlugins("form-editor-field-validator")
            .map(plugin => plugin.validator)
            .map(validator => {
                if (fieldType.field.validators.includes(validator.name)) {
                    return { optional: true, validator: validator };
                } else if (fieldType.field.validators.includes(`!${validator.name}`)) {
                    return { optional: false, validator: validator };
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

    const { Bind } = form;

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
                            <SimpleFormHeader
                                title={validator.label}
                                description={validator.description}
                            >
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
                            {data && typeof validator.renderSettings === "function" && (
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
                                    {({ Bind }) => (
                                        <SimpleFormContent>
                                            {validator.renderSettings({
                                                data,
                                                Bind
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
