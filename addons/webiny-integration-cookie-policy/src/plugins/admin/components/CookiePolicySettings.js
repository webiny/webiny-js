// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Switch } from "webiny-ui/Switch";
import { Input } from "webiny-ui/Input";
import { ColorPicker } from "webiny-ui/ColorPicker";
import { ButtonSecondary, ButtonPrimary } from "webiny-ui/Button";
import { Query, Mutation } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";
import { RadioGroup, Radio } from "webiny-ui/Radio";
import graphql from "./graphql";
import showCookiePolicy from "./../../utils/showCookiePolicy";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-admin/components/Views/SimpleForm";

const positionOptions = [
    { id: "bottom", name: "Bottom" },
    { id: "top", name: "Top" },
    { id: "bottom-left", name: "Floating left" },
    { id: "bottom-right", name: "Floating right" }
];

const CookiePolicySettings = ({ showSnackbar }) => {
    return (
        <Query query={graphql.query}>
            {({ data }) => (
                <Mutation mutation={graphql.mutation}>
                    {update => (
                        <Form
                            data={data.settings}
                            onSubmit={async data => {
                                await update({
                                    variables: {
                                        data: data.cookiePolicy
                                    }
                                });
                                showSnackbar("Settings updated successfully.");
                            }}
                        >
                            {({ Bind, form, data }) => (
                                <SimpleForm>
                                    <SimpleFormHeader title="Cookie Policy Settings">
                                        <Bind
                                            name={"cookiePolicy.enabled"}
                                            afterChange={aaa => {
                                                if (!aaa) {
                                                    form.submit();
                                                }
                                            }}
                                        >
                                            <Switch label="Enabled" />
                                        </Bind>
                                    </SimpleFormHeader>
                                    {data.cookiePolicy && data.cookiePolicy.enabled ? (
                                        <>
                                            <SimpleFormContent>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Grid>
                                                            <Cell span={3}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.palette.popup.background"
                                                                    }
                                                                >
                                                                    <ColorPicker label="Banner background color" />
                                                                </Bind>
                                                            </Cell>
                                                            <Cell span={3}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.palette.popup.text"
                                                                    }
                                                                >
                                                                    <ColorPicker label="Banner text color" />
                                                                </Bind>
                                                            </Cell>
                                                            <Cell span={3}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.palette.button.background"
                                                                    }
                                                                >
                                                                    <ColorPicker label="Button background color" />
                                                                </Bind>
                                                            </Cell>
                                                            <Cell span={3}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.palette.button.text"
                                                                    }
                                                                >
                                                                    <ColorPicker label="Button text color" />
                                                                </Bind>
                                                            </Cell>
                                                        </Grid>
                                                    </Cell>
                                                </Grid>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Grid>
                                                            <Cell span={12}>
                                                                <Bind
                                                                    name={"cookiePolicy.position"}
                                                                >
                                                                    <RadioGroup label="Position">
                                                                        {({
                                                                            onChange,
                                                                            getValue
                                                                        }) => (
                                                                            <React.Fragment>
                                                                                {positionOptions.map(
                                                                                    ({
                                                                                        id,
                                                                                        name
                                                                                    }) => (
                                                                                        <Radio
                                                                                            key={id}
                                                                                            label={
                                                                                                name
                                                                                            }
                                                                                            value={getValue(
                                                                                                id
                                                                                            )}
                                                                                            onChange={onChange(
                                                                                                id
                                                                                            )}
                                                                                        />
                                                                                    )
                                                                                )}
                                                                            </React.Fragment>
                                                                        )}
                                                                    </RadioGroup>
                                                                </Bind>
                                                            </Cell>

                                                            <Cell span={12}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.content.message"
                                                                    }
                                                                >
                                                                    <Input
                                                                        label="Message"
                                                                        desciption={
                                                                            "Link to your own policy\n"
                                                                        }
                                                                    />
                                                                </Bind>
                                                            </Cell>

                                                            <Cell span={12}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.content.dismiss"
                                                                    }
                                                                >
                                                                    <Input
                                                                        label="Dismiss button text"
                                                                        desciption={
                                                                            "Link to your own policy\n"
                                                                        }
                                                                    />
                                                                </Bind>
                                                            </Cell>

                                                            <Cell span={12}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.content.href"
                                                                    }
                                                                >
                                                                    <Input
                                                                        validators={["url"]}
                                                                        label="Policy link"
                                                                        desciption={
                                                                            "Link to your own policy\n"
                                                                        }
                                                                    />
                                                                </Bind>
                                                            </Cell>

                                                            <Cell span={12}>
                                                                <Bind
                                                                    name={
                                                                        "cookiePolicy.content.link"
                                                                    }
                                                                >
                                                                    <Input
                                                                        validators={["url"]}
                                                                        label="Policy link"
                                                                        desciption={
                                                                            "Link to your own policy\n"
                                                                        }
                                                                    />
                                                                </Bind>
                                                            </Cell>
                                                        </Grid>
                                                    </Cell>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <ButtonSecondary
                                                    type="primary"
                                                    align="right"
                                                    onClick={() => {
                                                        showCookiePolicy({
                                                            ...data.cookiePolicy,
                                                            // Official bug fix.
                                                            messagelink:
                                                                '<span id="cookieconsent:desc" class="cc-message">{{message}} <a aria-label="learn more about cookies" tabindex="0" class="cc-link" href="{{href}}" target="_blank">{{link}}</a></span>',
                                                            dismissOnTimeout: 5000,
                                                            cookie: {
                                                                expiryDays: 0.00000001
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Preview
                                                </ButtonSecondary>
                                                &nbsp;
                                                <ButtonPrimary
                                                    type="primary"
                                                    onClick={form.submit}
                                                    align="right"
                                                >
                                                    Save
                                                </ButtonPrimary>
                                            </SimpleFormFooter>
                                        </>
                                    ) : null}
                                </SimpleForm>
                            )}
                        </Form>
                    )}
                </Mutation>
            )}
        </Query>
    );
};

export default withSnackbar()(CookiePolicySettings);
