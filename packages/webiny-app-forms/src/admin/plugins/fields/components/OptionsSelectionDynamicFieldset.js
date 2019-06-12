import { DynamicFieldset } from "webiny-ui/DynamicFieldset";
import { Input } from "webiny-ui/Input";
import React from "react";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { css } from "emotion";
import { ButtonPrimary, ButtonSecondary } from "webiny-ui/Button";
import { trim } from "lodash";

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
    value: currentDefaultValue,
    option,
    onChange: setDefaultValue
}) => {
    if (currentDefaultValue === option.value) {
        return (
            <ButtonPrimary small onClick={() => setDefaultValue(null)}>
                Default
            </ButtonPrimary>
        );
    }

    return (
        <ButtonSecondary small onClick={() => setDefaultValue(option.value)}>
            Default
        </ButtonSecondary>
    );
};

export default ({ Bind }) => {
    return (
        <Bind name={"options"}>
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
                                        <Cell span={3}>
                                            <Bind
                                                name={`options.${index}.value`}
                                                validators={["required"]}
                                                beforeChange={(tag, cb) => cb(trim(tag))}
                                            >
                                                <Input label={"Value"} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={4}>
                                            <Bind
                                                name={`options.${index}.label`}
                                                validators={["required"]}
                                            >
                                                <Input label={"Label"} />
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
                                                    option={value[index]}
                                                    options={value}
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
