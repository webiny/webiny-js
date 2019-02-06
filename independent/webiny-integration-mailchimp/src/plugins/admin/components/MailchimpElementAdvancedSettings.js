// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { withCms } from "webiny-app-cms/context";
import MailchimpElement from "./MailchimpElement";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import { getPlugins } from "webiny-plugins";

const MailchimpElementAdvancedSettings = ({ Bind }: Object) => {
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
                                {({ value: id, onChange }) => {
                                    const options = (
                                        get(data, "mailchimp.listLists.data") || []
                                    ).map(({ id, name }) => {
                                        return { id, name };
                                    });

                                    const value = options.find(item => item.id === id);

                                    return (
                                        <AutoComplete
                                            options={options}
                                            value={value}
                                            onChange={onChange}
                                            label={"Mailchimp list"}
                                        />
                                    );
                                }}
                            </Bind>
                        )}
                    </Query>

                    <Bind name={"settings.component"} validators={["required"]}>
                        {({ onChange, value: name }) => {
                            const options = getPlugins("cms-element-mailchimp-component").map(
                                ({ name, title }) => {
                                    return {
                                        name,
                                        title
                                    };
                                }
                            );

                            const value = options.find(item => item.name === name);

                            return (
                                <AutoComplete
                                    value={value}
                                    options={options}
                                    onChange={onChange}
                                    textProp="title"
                                    valueProp="name"
                                    label="Mailchimp component"
                                    description="Select a component that renders the signup form."
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
