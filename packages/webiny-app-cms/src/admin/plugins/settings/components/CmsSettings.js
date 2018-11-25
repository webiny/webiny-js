// @flow
import * as React from "react";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import Image from "./Image";
import { Form } from "webiny-form";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import { get } from "lodash";

const getSettings = gql`
    query getCmsSettings {
        cms {
            getCmsSettings {
                data {
                    general {
                        name
                        logo {
                            src
                        }
                        favicon {
                            src
                        }
                        social {
                            facebook
                            twitter
                            instagram
                        }
                    }
                }
            }
        }
    }
`;

const CmsSettings = () => {
    return (
        <Query query={getSettings}>
            {({ data, loading }) => {
                if (loading) {
                    return true;
                }

                const settings = get(data, "cms.getCmsSettings.data");
                return (
                    <Form data={settings}>
                        {({ Bind }) => (
                            <>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name={"general.name"}>
                                            <DelayedOnChange>
                                                <Input
                                                    validators={["required", "url"]}
                                                    label="Website name"
                                                />
                                            </DelayedOnChange>
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind name={"general.favicon"}>
                                            <Image label="Favicon" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind name={"general.logo"}>
                                            <Image label="Logo" />
                                        </Bind>
                                    </Cell>
                                </Grid>
                                <br />
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name={"social.facebook"} validators={["url"]}>
                                            <DelayedOnChange>
                                                <Input label="Facebook" />
                                            </DelayedOnChange>
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"social.twitter"} validators={["url"]}>
                                            <DelayedOnChange>
                                                <Input label="Twitter" />
                                            </DelayedOnChange>
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"social.instagram"} validators={["url"]}>
                                            <DelayedOnChange>
                                                <Input label="Instagram" />
                                            </DelayedOnChange>
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </>
                        )}
                    </Form>
                );
            }}
        </Query>
    );
};

export default CmsSettings;
