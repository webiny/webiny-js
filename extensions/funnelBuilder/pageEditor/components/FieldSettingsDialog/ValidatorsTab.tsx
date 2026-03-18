import React, { useCallback, useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { Switch } from "webiny/admin/ui";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { BindComponentRenderProp, Form, useBind } from "webiny/admin/form";
import { Grid, Input } from "webiny/admin/ui";
import { required } from "../../../utils/validators";
import { FunnelFieldDefinitionModel } from "../../../shared/models/FunnelFieldDefinitionModel";
import { PbEditorFunnelFieldValidatorPluginProps } from "../plugins/PbEditorFunnelFieldValidatorPlugin";
import { FieldValidatorDto } from "../../../shared/models/validators/AbstractValidator";
import { validatorFromDto } from "../../../shared/models/validators/validatorFactory";

interface ValidatorsTabProps {
    field: FunnelFieldDefinitionModel;
}

export const ValidatorsTab = ({ field }: ValidatorsTabProps) => {
    const supportedValidators = useMemo<PbEditorFunnelFieldValidatorPluginProps[]>(() => {
        const fieldSupportedValidators = field.supportedValidatorTypes;
        if (!fieldSupportedValidators) {
            return [];
        }

        const validatorPlugins = plugins.byType(
            "pb-editor-funnel-field-validator"
        ) as unknown as PbEditorFunnelFieldValidatorPluginProps[];

        return validatorPlugins.filter(plugin => {
            return fieldSupportedValidators.includes(plugin.validatorType);
        });
    }, [field.supportedValidatorTypes]);

    const { value: validatorsValue, onChange: updateValidatorsValue } = useBind({
        name: "validators"
    }) as BindComponentRenderProp<FieldValidatorDto[]>;

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
            {supportedValidators.map(validatorPlugin => {
                const validator = validatorsValue.find(
                    item => item.type === validatorPlugin.validatorType
                );

                const validatorIndex = validatorsValue.findIndex(
                    item => item.type === validatorPlugin.validatorType
                );

                return (
                    <SimpleForm key={validatorPlugin.validatorType}>
                        <SimpleFormHeader title={validatorPlugin.label}>
                            <Switch
                                label="Enabled"
                                value={!!validator}
                                onChange={() => toggleValidator(validatorPlugin.validatorType)}
                            />
                        </SimpleFormHeader>
                        {validator && (
                            <Form<FieldValidatorDto>
                                data={validator}
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
                                        validatorPlugin;
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
                                                    setMessage={message =>
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
