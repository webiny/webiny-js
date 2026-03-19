import React, { useCallback, useMemo } from "react";
import { Switch } from "webiny/admin/ui";
import { Form, useBind } from "webiny/admin/form";
import { Grid, Input } from "webiny/admin/ui";
import { required } from "../../../utils/validators";
import { FunnelFieldDefinitionModel } from "../../../models/FunnelFieldDefinitionModel";
import { FieldValidatorDto } from "../../../models/validators/AbstractValidator";
import { validatorFromDto } from "../../../models/validators/validatorFactory";
import { fieldValidators } from "../fieldValidators";

interface ValidatorsTabProps {
    field: FunnelFieldDefinitionModel;
}
1;
interface ValidatorsUseBind {
    value: FieldValidatorDto[];
    onChange: (value: FieldValidatorDto[]) => void;
}

const SimpleForm = (props: any) => <>{props.children}</>;
const SimpleFormContent = (props: any) => <>{props.children}</>;
const SimpleFormHeader = (props: any) => <>{props.children}</>;

export const ValidatorsTab = ({ field }: ValidatorsTabProps) => {
    const supportedValidators = useMemo(() => {
        const fieldSupportedValidators = field.supportedValidatorTypes;
        if (!fieldSupportedValidators) {
            return [];
        }

        return fieldValidators.filter(validator =>
            fieldSupportedValidators.includes(validator.validatorType)
        );
    }, [field.supportedValidatorTypes]);

    const { value: validatorsValue, onChange: updateValidatorsValue } = useBind({
        name: "validators"
    }) as ValidatorsUseBind;

    const toggleValidator = useCallback(
        (validatorType: string) => {
            const alreadyEnabled = validatorsValue.some(item => item.type === validatorType);

            if (alreadyEnabled) {
                updateValidatorsValue([
                    ...validatorsValue.filter(item => item.type !== validatorType)
                ]);
            } else {
                // We're immediately transforming the validator type to a DTO because we need
                // to use DTOs as form data. Form data cannot be a class (model) instance.
                const newValidator = validatorFromDto({ type: validatorType, params: {} }).toDto();
                updateValidatorsValue([...validatorsValue, newValidator]);
            }
        },
        [validatorsValue]
    );

    return (
        <>
            {supportedValidators.map(validator => {
                const validatorValue = validatorsValue.find(
                    item => item.type === validator.validatorType
                );

                const validatorIndex = validatorsValue.findIndex(
                    item => item.type === validator.validatorType
                );

                return (
                    <SimpleForm key={validator.validatorType}>
                        <SimpleFormHeader title={validator.label}>
                            <Switch
                                label="Enabled"
                                checked={!!validatorValue}
                                onChange={() => toggleValidator(validator.validatorType)}
                            />
                        </SimpleFormHeader>
                        {validatorValue && (
                            <Form<FieldValidatorDto>
                                data={validatorValue}
                                onChange={data => {
                                    updateValidatorsValue([
                                        ...validatorsValue.slice(0, validatorIndex),
                                        data,
                                        ...validatorsValue.slice(validatorIndex + 1)
                                    ]);
                                }}
                            >
                                {({ Bind, setValue }) => {
                                    const { settingsRenderer: SettingsRendererComponent } =
                                        validator;
                                    return (
                                        <SimpleFormContent>
                                            <Grid>
                                                <Grid.Column span={12}>
                                                    <Bind
                                                        name={"params.errorMessage"}
                                                        validators={required}
                                                    >
                                                        <Input
                                                            label={"Message"}
                                                            description={
                                                                "This message will be displayed to the user"
                                                            }
                                                        />
                                                    </Bind>
                                                </Grid.Column>
                                            </Grid>

                                            {SettingsRendererComponent && (
                                                <SettingsRendererComponent
                                                    field={field}
                                                    setMessage={(message: string) =>
                                                        setValue("params.errorMessage", message)
                                                    }
                                                />
                                            )}
                                        </SimpleFormContent>
                                    );
                                }}
                            </Form>
                        )}
                    </SimpleForm>
                );
            })}
        </>
    );
};
