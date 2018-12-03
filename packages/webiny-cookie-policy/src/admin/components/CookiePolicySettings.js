// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Switch } from "webiny-ui/Switch";
import { ColorPicker } from "webiny-ui/ColorPicker";
import { ButtonSecondary, ButtonPrimary } from "webiny-ui/Button";
import { Query, Mutation } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import { RadioGroup, Radio } from "webiny-ui/Radio";
import graphql from "./graphql";
import load from "webiny-load-assets";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";

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
                                                        </Grid>
                                                    </Cell>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <ButtonSecondary
                                                    type="primary"
                                                    onClick={() => {
                                                        load(
                                                            "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.css",
                                                            "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js"
                                                        ).then(() => {
                                                            window.cookieconsent.initialise({
                                                                ...data.cookiePolicy,
                                                                dismissOnTimeout: 5000,
                                                                cookie: {
                                                                    expiryDays: 0.00000001
                                                                }
                                                            });
                                                        });
                                                    }}
                                                    align="right"
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
