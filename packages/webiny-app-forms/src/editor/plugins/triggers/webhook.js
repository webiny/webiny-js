import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as LinkIcon } from "./icons/round-link-24px.svg";
import { DynamicFieldset } from "webiny-ui/DynamicFieldset";
import { Input } from "webiny-ui/Input";
import { Typography } from "webiny-ui/Typography";
import { css } from "emotion";
import { ButtonPrimary, ButtonSecondary } from "webiny-ui/Button";

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

export default {
    type: "form-editor-trigger",
    name: "form-editor-trigger-webhook",
    trigger: {
        id: "webhook",
        title: "Webhook",
        description: "Do a POST HTTP request to a specific URL.",
        icon: <LinkIcon />,
        renderSettings({ Bind, submit }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"urls"}>
                            {({ value, onChange, ...other }) => (
                                <DynamicFieldset value={value} onChange={onChange} {...other}>
                                    {({ actions, header, row, empty }) => (
                                        <>
                                            {header(() => (
                                                <Grid style={{ paddingTop: 0, paddingBottom: 0 }}>
                                                    <Cell span={12} className={textStyling}>
                                                        <Typography use={"button"}>
                                                            Webhook URLs
                                                        </Typography>
                                                    </Cell>
                                                </Grid>
                                            ))}
                                            {row(({ index }) => (
                                                <Grid>
                                                    <Cell span={9}>
                                                        <Bind
                                                            name={`urls.${index}`}
                                                            validators={["required", "url"]}
                                                        >
                                                            <Input label={"URL"} />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={3} className={controlButtons}>
                                                        <ButtonPrimary
                                                            small
                                                            onClick={actions.add(index)}
                                                        >
                                                            +
                                                        </ButtonPrimary>
                                                        <ButtonSecondary
                                                            small
                                                            onClick={actions.remove(index)}
                                                        >
                                                            -
                                                        </ButtonSecondary>
                                                    </Cell>
                                                </Grid>
                                            ))}
                                            {empty(() => (
                                                <Grid>
                                                    <Cell span={12} className={textStyling}>
                                                        <Typography use={"button"}>
                                                            Webhook URLs
                                                        </Typography>
                                                        <br />
                                                        <ButtonPrimary onClick={actions.add()}>
                                                            Add URL
                                                        </ButtonPrimary>
                                                    </Cell>
                                                </Grid>
                                            ))}
                                        </>
                                    )}
                                </DynamicFieldset>
                            )}
                        </Bind>
                    </Cell>
                    <Cell>
                        <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                    </Cell>
                </Grid>
            );
        }
    }
};
