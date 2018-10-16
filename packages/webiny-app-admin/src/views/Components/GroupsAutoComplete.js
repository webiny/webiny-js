// @flow
import * as React from "react";
import { withDataList } from "webiny-app/components";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { groupsAutoComplete } from "./graphql";
import { compose } from "recompose";
import { get, debounce } from "lodash";

const GroupsAutoComplete = props => {
    const { groupsList, ...rest } = props;

    return (
        <AutoComplete
            {...rest}
            multiple
            options={get(groupsList, "data.security.groups.data", [])}
            onInput={debounce(query => {
                query && groupsList.setSearch({ query, fields: ["name", "description"] });
            }, 250)}
        />
    );
};

export default compose(
    withDataList({
        name: "groupsList",
        query: groupsAutoComplete,
        variables: { sort: { savedOn: -1 } }
    })
)(GroupsAutoComplete);
