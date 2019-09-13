// @flow
import * as React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { SEARCH_LOCALE_CODES } from "./graphql";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";

const LocaleCodesAutoComplete = props => {
    const autoComplete = useAutocomplete(SEARCH_LOCALE_CODES);
    const options = [...autoComplete.options];
    if (props.value && !options.includes(props.value)) {
        options.push(props.value);
    }

    return <AutoComplete {...props} {...autoComplete} options={options} useSimpleValues  />;
};

export default LocaleCodesAutoComplete;
