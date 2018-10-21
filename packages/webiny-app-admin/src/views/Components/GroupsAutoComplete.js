// @flow
import * as React from "react";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { groupsAutoComplete } from "./graphql";
import { get } from "lodash";
import { Query } from "react-apollo";

const GroupsAutoComplete = (props: Object) => (
    <AutoComplete multiple unique {...props}>
        {({ query, renderOptions }) => (
            <Query
                query={groupsAutoComplete}
                variables={{
                    sort: { savedOn: -1 },
                    search: { query, fields: ["name", "description"] }
                }}
            >
                {({ data }) => renderOptions(get(data, "security.groups.data", []))}
            </Query>
        )}
    </AutoComplete>
);

export default GroupsAutoComplete;
