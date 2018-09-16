// @flow
import * as React from "react";
import { withDataList } from "webiny-app/components";
import { AutoComplete } from "webiny-ui/AutoComplete";

let timeout: ?TimeoutID = null;

const PoliciesAutoComplete = props => {
    const { options, ...rest } = props;

    return (
        <AutoComplete
            {...rest}
            multiple
            options={options.data}
            onInput={query => {
                timeout && clearTimeout(timeout);
                timeout = setTimeout(() => {
                    query && options.setSearch({ query, fields: ["name", "description"] });
                }, 250);
            }}
        />
    );
};

export default withDataList({
    prop: "options",
    name: "SecurityPoliciesPoliciesAutoComplete",
    type: "Security.Policies",
    fields: "id name",
    sort: { savedOn: -1 }
})(PoliciesAutoComplete);
