// @flow
import * as React from "react";
import { withDataList } from "webiny-app/components";
import { AutoComplete } from "webiny-ui/AutoComplete";

let timeout: ?TimeoutID = null;

const GroupsAutoComplete = props => {
    const { options, ...rest } = props;

    return (
        <AutoComplete
            {...rest}
            multiple
            options={options.data}
            onInput={query => {
                timeout && clearTimeout(timeout);
                timeout = setTimeout(
                    () => query && options.setSearch({ query, fields: ["name", "description"] }),
                    250
                );
            }}
        />
    );
};

export default withDataList({
    prop: "options",
    name: "SecurityPoliciesGroupsAutoComplete",
    type: "Security.Groups",
    fields: "id name",
    sort: { savedOn: -1 }
})(GroupsAutoComplete);
