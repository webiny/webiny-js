// @flow
import * as React from "react";
import { compose } from "recompose";
import { get } from "dot-prop-immutable";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { AutoComplete } from "webiny-ui/AutoComplete";

let timeout: ?TimeoutID = null;

const loadRoles = gql`
    {
        security {
            listRoles(sort: { savedOn: -1 }) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

const RolesAutoComplete = () => {
    return (
        <Query query={loadRoles}>
            {({ data, refetch }) => (
                <AutoComplete
                    multiple
                    options={get(data, "security.listRoles.data") || []}
                    onInput={query => {
                        timeout && clearTimeout(timeout);
                        timeout = setTimeout(
                            () =>
                                query &&
                                refetch({
                                    search: {
                                        query,
                                        fields: ["name", "description"]
                                    }
                                }),
                            250
                        );
                    }}
                />
            )}
        </Query>
    );
};

export default RolesAutoComplete;
