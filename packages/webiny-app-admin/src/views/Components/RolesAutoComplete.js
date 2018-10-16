// @flow
import * as React from "react";
import { withDataList } from "webiny-app/components";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { rolesAutoComplete } from "./graphql";
import { compose } from "recompose";
import { get, debounce } from "lodash";

const RolesAutoComplete = props => {
    const { rolesList, ...rest } = props;

    return (
        <AutoComplete
            {...rest}
            multiple
            options={get(rolesList, "data.security.roles.data", [])}
            onInput={debounce(query => {
                query && rolesList.setSearch({ query, fields: ["name", "description"] });
            }, 250)}
        />
    );
};

export default compose(
    withDataList({
        name: "rolesList",
        query: rolesAutoComplete,
        variables: { sort: { savedOn: -1 } }
    })
)(RolesAutoComplete);
