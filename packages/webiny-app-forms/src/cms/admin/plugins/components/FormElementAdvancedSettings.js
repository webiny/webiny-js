// @flow
import * as React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import { Grid, Cell } from "webiny-ui/Grid";
import { AutoComplete } from "webiny-ui/AutoComplete";
import styled from "react-emotion";

const FormOptionsWrapper = styled("div")({
    minHeight: 250
});

const FormElementAdvancedSettings = ({ Bind }: Object) => {
    return (
        <FormOptionsWrapper>
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
                                                description="Type to search for the form you wish to insert."
                                            />
                                        );
                                    }}
                                </Bind>
                            </Cell>
                        </Grid>
                    </>
                )}
            </Query>
        </FormOptionsWrapper>
    );
};

export default FormElementAdvancedSettings;
