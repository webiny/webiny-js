// @flow
import * as React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { withAutoComplete } from "@webiny/app/components";
import { compose } from "recompose";
import { get } from "lodash";
import { searchLocaleCodes } from "./graphql";

const LocaleCodesAutoComplete = props => {
    const options = [...props.options];
    if (props.value && !options.includes(props.value)) {
        options.push(props.value);
    }

    return <AutoComplete {...props} options={options} useSimpleValues />;
};

export default compose(
    withAutoComplete({
        response: data => get(data, "i18n.codes"),
        query: searchLocaleCodes
    })
)(LocaleCodesAutoComplete);
