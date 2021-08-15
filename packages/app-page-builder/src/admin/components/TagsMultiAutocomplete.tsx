import * as React from "react";
import { MultiAutoComplete as UiMultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";
import gql from "graphql-tag";

const LIST_PAGE_TAGS = gql`
    query ListPageTags($search: String!) {
        pageBuilder {
            listPageTags(search: { query: $search }) {
                data
                error {
                    message
                }
            }
        }
    }
`;

export function TagsMultiAutocomplete(props) {
    const autoComplete = useAutocomplete({
        search: query => query,
        query: LIST_PAGE_TAGS
    });
    return (
        <UiMultiAutoComplete
            {...props}
            {...autoComplete}
            label={props.label || "Tags"}
            useSimpleValues
            allowFreeInput
        />
    );
}
