// @flow
import * as React from "react";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { rolesAutoComplete } from "./graphql";
import { get } from "lodash";
import { Query } from "react-apollo";

const RolesAutoComplete = (props: Object) => (
    <AutoComplete multiple unique {...props}>
        {({ query, renderOptions }) => (
            <Query
                query={rolesAutoComplete}
                variables={{
                    sort: { savedOn: -1 },
                    search: { query, fields: ["name", "description"] }
                }}
            >
                {({ data }) => renderOptions(get(data, "security.roles.data", []))}
            </Query>
        )}
    </AutoComplete>
);

export default RolesAutoComplete;
