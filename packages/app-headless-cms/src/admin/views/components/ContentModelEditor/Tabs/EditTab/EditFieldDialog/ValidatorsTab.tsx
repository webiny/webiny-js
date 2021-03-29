import React from "react";
import { css } from "emotion";
import { cloneDeep, debounce } from "lodash";
import { Switch } from "@webiny/ui/Switch";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { CmsEditorField } from "~/types";

const onEnabledChange = ({ data, validationValue, onChangeValidation, validator }) => {
    if (data) {
        const index = validationValue.findIndex(item => item.name === validator.name);
        onChangeValidation([
            ...validationValue.slice(0, index),
            ...validationValue.slice(index + 1)
        ]);
    } else {
        onChangeValidation([
            ...validationValue,
            {
                name: validator.name,
                settings: validator.defaultSettings,
                message: validator.defaultMessage
            }
        ]);
    }
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

interface ValidatorsTabProps {
    name: string;
    validators: any[];
    form: any;
    field: CmsEditorField;
}

const ValidatorsTab: React.FunctionComponent<ValidatorsTabProps> = props => {
    const {
        field,
        name,
        validators,
        form: { Bind }
    } = props;

    return (
        <Bind name={name} defaultValue={[]}>
            {({ value: validationValue, onChange: onChangeValidation }) => {
                return validators.map(({ optional, validator }) => {
                    const validatorIndex = (validationValue || []).findIndex(
                        item => item.name === validator.name
                    );
                    const data = (validationValue || [])[validatorIndex];

                    return (
                        <SimpleForm key={validator.name} noElevation className={noMargin}>
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
                                                    field,
                                                    setValue,
                                                    setMessage: message => {
                                                        setValue("message", message);
                                                    },
                                                    data,
                                                    Bind
                                                })}
                                        </SimpleFormContent>
                                    )}
                                </Form>
                            )}
                        </SimpleForm>
                    );
                });
            }}
        </Bind>
    );
};

export default ValidatorsTab;
