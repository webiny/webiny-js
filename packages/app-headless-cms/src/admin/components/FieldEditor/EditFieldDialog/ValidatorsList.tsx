import React, { Fragment } from "react";
import { css } from "emotion";
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";
import { plugins } from "@webiny/plugins";
import { Switch } from "@webiny/ui/Switch";
import { Form, Bind } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { CmsModelFieldValidator, CmsModelFieldValidatorPlugin } from "~/types";
import { Validator } from "@webiny/validation/types";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { CmsModelFieldValidatorConfigAdapter } from "~/utils/CmsModelFieldValidatorConfigAdapter";
import styled from "@emotion/styled";
import { Tooltip } from "@webiny/ui/Tooltip";

const Variable = styled.span`
    font-weight: bold;
    cursor: pointer;
`;

const Comma = styled.span`
    padding-right: 5px;
`;

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
    (validators: CmsModelFieldValidator[]): void;
}

interface OnEnabledChangeParams {
    data: CmsModelFieldValidator;
    validationValue: CmsModelFieldValidator[];
    onChangeValidation: OnChangeValidationCallable;
    validator: CmsModelFieldValidatorConfigAdapter;
}

const onEnabledChange = (params: OnEnabledChangeParams): void => {
    const { data, validationValue, onChangeValidation, validator } = params;
    if (data) {
        const index = validationValue.findIndex(item => item.name === validator.getName());
        onChangeValidation([
            ...validationValue.slice(0, index),
            ...validationValue.slice(index + 1)
        ]);
        return;
    }
    onChangeValidation([
        ...validationValue,
        {
            name: validator.getName(),
            settings: validator.getDefaultSettings(),
            message: validator.getDefaultMessage()
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

interface ValidatorsTabProps {
    name: string;
    validators: CmsModelFieldValidatorConfigAdapter[];
}

const renderEmpty = () => null;

const getValidatorPlugin = (name: string): CmsModelFieldValidatorPlugin["validator"] | null => {
    const plugin = plugins
        .byType<CmsModelFieldValidatorPlugin>("cms-model-field-validator")
        .find(plugin => plugin.validator.name === name);

    if (!plugin) {
        return null;
    }

    return plugin.validator;
};

interface ValidatorItemProps {
    validator: CmsModelFieldValidatorConfigAdapter;
    value: any;
    onChange: OnChangeValidationCallable;
}

const ValidatorItem = ({ validator, value, onChange }: ValidatorItemProps) => {
    const validatorName = validator.getName();

    const plugin = getValidatorPlugin(validatorName);
    if (!plugin) {
        return <></>;
    }

    const validatorIndex = ((value || []) as Validator[]).findIndex(
        item => item.name === validatorName
    );

    const data = (value || [])[validatorIndex];

    if (typeof plugin.renderCustomUi === "function") {
        return <Fragment key={validatorName}>{plugin.renderCustomUi()}</Fragment>;
    }

    const renderSettings = plugin.renderSettings || renderEmpty;

    const actions = !validator.isRequired() ? (
        <AccordionItem.Actions>
            <Switch
                label="Enabled"
                value={validatorIndex >= 0}
                onChange={() =>
                    onEnabledChange({
                        data,
                        validationValue: value,
                        onChangeValidation: onChange,
                        validator: validator
                    })
                }
            />
        </AccordionItem.Actions>
    ) : null;

    const description = [<span key={"msg"}>This message will be displayed to the user.</span>];
    const variables = validator.getVariables();

    if (variables.length) {
        description.push(<span key={"vars"}>&nbsp;Available variables:&nbsp;</span>);
        for (let i = 0; i < variables.length; i++) {
            const variable = variables[i];

            description.push(
                <Tooltip key={variable.name} content={variable.description} placement={"bottom"}>
                    <Variable dangerouslySetInnerHTML={{ __html: `{${variable.name}}` }} />
                </Tooltip>
            );

            if (i < variables.length - 1) {
                description.push(<Comma key={`comma-${i}`}>,</Comma>);
            }
        }
        description.push(<Comma key={"dot"}>.</Comma>);
    }

    return (
        <AccordionItem
            key={validator.getName()}
            data-testid={`cms.editor.field-validator.${validator.getName()}`}
            interactive={false}
            open={!!data}
            title={validator.getLabel()}
            description={validator.getDescription()}
            actions={actions}
            className={noPadding}
        >
            {data && (
                <Form
                    data={data}
                    onChange={data =>
                        onFormChange({
                            data,
                            validationValue: value,
                            onChangeValidation: onChange,
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
                                        validators={validation.create("required")}
                                    >
                                        {bind => {
                                            return (
                                                <Input
                                                    {...bind}
                                                    label={"Message"}
                                                    data-testid="cms.editfield.validators.required"
                                                    description={<>{description}</>}
                                                />
                                            );
                                        }}
                                    </Bind>
                                </Cell>
                            </Grid>

                            {renderSettings(validator)}
                        </>
                    )}
                </Form>
            )}
        </AccordionItem>
    );
};

export const ValidatorsList = (props: ValidatorsTabProps) => {
    const { name, validators } = props;

    return (
        <Bind name={name} defaultValue={[]}>
            {bind => {
                const { value, onChange } = bind;
                return (
                    <Accordion>
                        {validators.map(validator => {
                            return (
                                <ValidatorItem
                                    key={validator.getName()}
                                    value={value}
                                    onChange={onChange}
                                    validator={validator}
                                />
                            );
                        })}
                    </Accordion>
                );
            }}
        </Bind>
    );
};
