// @flow
import { DynamicFieldset } from "webiny-ui/DynamicFieldset";
import { Input } from "webiny-ui/Input";
import * as React from "react";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { css } from "emotion";
import { ButtonPrimary, ButtonSecondary } from "webiny-ui/Button";
import { debounce, camelCase, trim } from "lodash";
import { I18NInput, useI18N } from "webiny-app-i18n/components";

const controlButtons = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ">button": {
        marginRight: 15
    }
});

const textStyling = css({
    color: "var(--mdc-theme-text-secondary-on-background)"
});

const SetOptionAsDefaultValue = ({
    multiple,
    option,
    value: currentDefaultValue,
    onChange: setDefaultValue
}: Object) => {
    if (multiple) {
        if (Array.isArray(currentDefaultValue) && currentDefaultValue.includes(option.value)) {
            return (
                <ButtonPrimary
                    small
                    onClick={() => {
                        const value = Array.isArray(currentDefaultValue)
                            ? [...currentDefaultValue]
                            : [];

                        value.splice(value.indexOf(option.value), 1);
                        setDefaultValue(value);
                    }}
                >
                    Selected
                </ButtonPrimary>
            );
        }

        return (
            <ButtonSecondary
                small
                onClick={() => {
                    const value = Array.isArray(currentDefaultValue)
                        ? [...currentDefaultValue]
                        : [];
                    value.push(option.value);
                    setDefaultValue(value);
                }}
            >
                Selected
            </ButtonSecondary>
        );
    }

    if (currentDefaultValue === option.value) {
        return (
            <ButtonPrimary small onClick={() => setDefaultValue("")}>
                Selected
            </ButtonPrimary>
        );
    }

    return (
        <ButtonSecondary small onClick={() => setDefaultValue(option.value)}>
            Selected
        </ButtonSecondary>
    );
};

const OptionsSelectionDynamicFieldset = ({ form, multiple }: Object) => {
    const { Bind, setValue } = form;
    const { translate } = useI18N();
    // $FlowFixMe
    const getAfterChangeLabel = React.useCallback(index => {
        return debounce(
            value => setValue(`settings.options.${index}.value`, camelCase(translate(value))),
            200
        );
    }, []);

    return (
        <Bind name={"settings.options"} validators={["minLength:2", "required"]}>
            {({ value, onChange, ...other }) => {
                return (
                    <DynamicFieldset value={value} onChange={onChange} {...other}>
                        {({ actions, header, row, empty }) => (
                            <>
                                {header(() => (
                                    <Grid style={{ paddingTop: 0, paddingBottom: 0 }}>
                                        <Cell span={12} className={textStyling}>
                                            <Typography use={"button"}>Options</Typography>
                                        </Cell>
                                    </Grid>
                                ))}
                                {row(({ index }) => (
                                    <Grid>
                                        <Cell span={4}>
                                            <Bind
                                                name={`settings.options.${index}.label`}
                                                validators={["required"]}
                                                afterChange={getAfterChangeLabel(index)}
                                            >
                                                <I18NInput label={"Label"} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={3}>
                                            <Bind
                                                name={`settings.options.${index}.value`}
                                                validators={["required"]}
                                                beforeChange={(tag, cb) => cb(trim(tag))}
                                            >
                                                <Input label={"Value"} />
                                            </Bind>
                                        </Cell>

                                        <Cell span={3} className={controlButtons}>
                                            <ButtonPrimary small onClick={actions.add(index)}>
                                                +
                                            </ButtonPrimary>
                                            <ButtonSecondary small onClick={actions.remove(index)}>
                                                -
                                            </ButtonSecondary>

                                            <Bind name={"defaultValue"}>
                                                <SetOptionAsDefaultValue
                                                    multiple={multiple}
                                                    option={value[index]}
                                                />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                ))}
                                {empty(() => (
                                    <Grid>
                                        <Cell span={12} className={textStyling}>
                                            <Typography use={"button"}>Options</Typography>
                                            <br />
                                            <ButtonPrimary onClick={actions.add()}>
                                                Add option
                                            </ButtonPrimary>
                                        </Cell>
                                    </Grid>
                                ))}
                            </>
                        )}
                    </DynamicFieldset>
                );
            }}
        </Bind>
    );
};

export default OptionsSelectionDynamicFieldset;
