// @flow
import * as React from "react";
import { withDataList } from "webiny-app/components";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { groupsAutoComplete } from "./graphql";
import { compose } from "recompose";
import { get, debounce } from "lodash";

const GroupsAutoComplete = ({ dataList, ...rest }) => {
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
        query: groupsAutoComplete,
        variables: { sort: { savedOn: -1 } },
        response: data => get(data, "security.groups")
    })
)(GroupsAutoComplete);
