// @flow
import * as React from "react";
import { trim } from "lodash";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";

type Props = {
    prefix: string,
    value: Array<Object>,
    onChange: Function,
    Bind: React.ComponentType<*>
};

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

const MetaTags = ({ prefix, value, onChange, Bind, ...other }: Props) => {
    return (
        <DynamicFieldset value={value} onChange={onChange} {...other}>
            {({ actions, header, row, empty }) => (
                <React.Fragment>
                    {header(() => (
                        <Grid style={{ paddingTop: 0, paddingBottom: 0 }}>
                            <Cell span={12} className={textStyling}>
                                <Typography use={"button"}>Meta tags</Typography>
                            </Cell>
                        </Grid>
                    ))}
                    {row(({ index }) => (
                        <Grid>
                            <Cell span={3}>
                                <Bind
                                    name={`${prefix}.${index}.name`}
                                    validators={["required"]}
                                    beforeChange={(tag, cb) => cb(trim(tag))}
                                >
                                    <Input label={"Name"} />
                                </Bind>
                            </Cell>
                            <Cell span={4}>
                                <Bind
                                    name={`${prefix}.${index}.content`}
                                    validators={["required"]}
                                    beforeChange={(tag, cb) => cb(trim(tag))}
                                >
                                    <Input label={"Content"} />
                                </Bind>
                            </Cell>
                            <Cell span={3} className={controlButtons}>
                                <ButtonPrimary small onClick={actions.add(index)}>
                                    +
                                </ButtonPrimary>
                                <ButtonSecondary small onClick={actions.remove(index)}>
                                    -
                                </ButtonSecondary>
                            </Cell>
                        </Grid>
                    ))}
                    {empty(() => (
                        <Grid>
                            <Cell span={12} className={textStyling}>
                                <Typography use={"button"}>
                                    To add other meta tags, click{" "}
                                    <ButtonPrimary onClick={actions.add()}>
                                        Add meta tag
                                    </ButtonPrimary>
                                </Typography>
                            </Cell>
                        </Grid>
                    ))}
                </React.Fragment>
            )}
        </DynamicFieldset>
    );
};

export default MetaTags;
