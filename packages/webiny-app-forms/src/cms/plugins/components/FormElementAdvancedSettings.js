// @flow
import * as React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import { Grid, Cell } from "webiny-ui/Grid";
import { AutoComplete } from "webiny-ui/AutoComplete";

const FormElementAdvancedSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Query
                query={gql`
                    {
                        forms {
                            listForms {
                                data {
                                    id
                                    name
                                }
                            }
                        }
                    }
                `}
            >
                {forms => (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"settings.form"} validators={["required"]}>
                                    {({ value: id, onChange }) => {
                                        const options = (
                                            get(forms.data, "forms.listForms.data") || []
                                        ).map(({ id, name }) => ({ id, name }));

                                        const value = options.find(item => item.id === id);

                                        return (
                                            <AutoComplete
                                                options={options}
                                                value={value}
                                                onChange={onChange}
                                                label={"Form"}
                                            />
                                        );
                                    }}
                                </Bind>
                            </Cell>
                        </Grid>
                    </>
                )}
            </Query>
        </React.Fragment>
    );
};

export default FormElementAdvancedSettings;
