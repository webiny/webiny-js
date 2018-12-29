// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { withCms } from "webiny-app-cms/context";
import MailchimpElement from "./MailchimpElement";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";

const MailchimpElementAdvancedSettings = ({ cms, Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Query
                        query={gql`
                            {
                                mailchimp {
                                    listLists {
                                        data {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        `}
                    >
                        {({ data }) => (
                            <Bind name={"settings.list"} validators={["required"]}>
                                {({ value, onChange }) => {
                                    return (
                                        <AutoComplete
                                            value={{ id: value }}
                                            onChange={onChange}
                                            label={"Mailchimp list"}
                                            options={get(data, "mailchimp.listLists.data", []).map(
                                                ({ id, name }) => {
                                                    return { id, name };
                                                }
                                            )}
                                        />
                                    );
                                }}
                            </Bind>
                        )}
                    </Query>

                    <Bind name={"settings.component"} validators={["required"]}>
                        {({ onChange, value }) => {
                            return (
                                <AutoComplete
                                    onChange={onChange}
                                    value={{ name: value }}
                                    textProp="title"
                                    valueProp="name"
                                    options={cms.theme.elements.mailchimp.components.map(
                                        ({ name, title }) => {
                                            return { name, title };
                                        }
                                    )}
                                    label={"Mailchimp component"}
                                    description={"Select a component that renders the signup form."}
                                />
                            );
                        }}
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12} style={{ overflowY: "scroll" }}>
                    <Bind name={"settings"}>
                        {({ value }) => (
                            <div>
                                <MailchimpElement element={{ settings: value }} />
                            </div>
                        )}
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default withCms()(MailchimpElementAdvancedSettings);
