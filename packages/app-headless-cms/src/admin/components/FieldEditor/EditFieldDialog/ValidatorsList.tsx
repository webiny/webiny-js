import React, { Fragment } from "react";
import { css } from "emotion";
import { cloneDeep, debounce } from "lodash";
import { Switch } from "@webiny/ui/Switch";
import { Form, Bind } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import {
    CmsEditorFieldValidator,
    CmsEditorFieldValidatorPlugin,
    CmsEditorFieldValidatorPluginValidator
} from "~/types";
import { Validator } from "@webiny/validation/types";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";

const noPadding = css`
    .webiny-ui-accordion-item__content {
        padding: 0 !important;
    }
`;

const gridBottomPadding = css`
    :not(:last-child) {
        padding-bottom: 0;
    }
`;

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

interface ValidatorsTabPropsValidator {
    optional: boolean;
    validator: CmsEditorFieldValidatorPlugin["validator"];
}
interface ValidatorsTabProps {
    name: string;
    validators: ValidatorsTabPropsValidator[];
}

const renderEmpty = () => null;

export const ValidatorsList: React.FC<ValidatorsTabProps> = props => {
    const { name, validators } = props;

    return (
        <Bind name={name} defaultValue={[]}>
            {bind => {
                const { value: validationValue, onChange: onChangeValidation } = bind;
                return (
                    <Accordion>
                        {validators.map(({ optional, validator }) => {
                            const validatorIndex = (
                                (validationValue || []) as Validator[]
                            ).findIndex(item => item.name === validator.name);
                            const data = (validationValue || [])[validatorIndex];

                            if (typeof validator.renderCustomUi === "function") {
                                return (
                                    <Fragment key={validator.name}>
                                        {validator.renderCustomUi()}
                                    </Fragment>
                                );
                            }

                            const renderSettings = validator.renderSettings || renderEmpty;

                            const actions = optional ? (
                                <AccordionItem.Actions>
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
                                </AccordionItem.Actions>
                            ) : null;

                            return (
                                <AccordionItem
                                    key={validator.name}
                                    data-testid={`cms.editor.field-validator.${validator.name}`}
                                    interactive={false}
                                    open={!!data}
                                    title={validator.label}
                                    description={validator.description}
                                    actions={actions}
                                    className={noPadding}
                                >
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
                                            {({ Bind }) => (
                                                <>
                                                    <Grid className={gridBottomPadding}>
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

                                                    {renderSettings()}
                                                </>
                                            )}
                                        </Form>
                                    )}
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                );
            }}
        </Bind>
    );
};
