import * as React from "react";
import gql from "graphql-tag";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";

export const SEARCH_LOCALE_CODES = gql`
    query SearchLocaleCodes($search: String) {
        i18n {
            codes: searchLocaleCodes(search: $search) {
                data
            }
        }
    }
`;

const LocaleCodesAutoComplete = props => {
    const autoComplete = useAutocomplete(SEARCH_LOCALE_CODES);
    const options = [...autoComplete.options];
    if (props.value && !options.includes(props.value)) {
        options.push(props.value);
    }

    return <AutoComplete {...props} {...autoComplete} options={options} useSimpleValues />;
};

export default LocaleCodesAutoComplete;
