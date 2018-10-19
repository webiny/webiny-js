// @flow
import * as React from "react";
import { withDataList } from "webiny-app/components";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { rolesAutoComplete } from "./graphql";
import { compose } from "recompose";
import { get, debounce } from "lodash";

const RolesAutoComplete = ({ dataList, ...rest }) => {
    return (
        <AutoComplete
            {...dataList}
            {...rest}
            multiple
            options={dataList.data}
            onInput={debounce(query => {
                query && dataList.setSearch({ query, fields: ["name", "description"] });
            }, 250)}
        />
    );
};

export default compose(
    withDataList({
        query: rolesAutoComplete,
        variables: { sort: { savedOn: -1 } },
        response: data => get(data, "security.roles")
    })
)(RolesAutoComplete);
