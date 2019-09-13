// @flow
import * as React from "react";
import { MultiAutoComplete as UiMultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";
import gql from "graphql-tag";

const SEARCH_TAGS = gql`
    query searchTags($search: String!) {
        pageBuilder {
            tags: searchTags(query: $search) {
                data
            }
        }
    }
`;

export function TagsMultiAutocomplete(props) {
    const autoComplete = useAutocomplete({
        search: query => query,
        query: SEARCH_TAGS
    });
    return (
        <UiMultiAutoComplete
            {...props}
            {...autoComplete}
            label="Tags"
            useSimpleValues
            allowFreeInput
        />
    );
}
