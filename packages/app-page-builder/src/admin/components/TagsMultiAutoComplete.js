// @flow
import * as React from "react";
import { MultiAutoComplete as UiMultiAutoComplete } from "@webiny/ui/AutoComplete";
import { withAutoComplete } from "@webiny/app/components";
import gql from "graphql-tag";
import { get } from "lodash";

const searchTags = gql`
    query SearchTags($search: String!) {
        pageBuilder {
            tags: searchTags(query: $search) {
                data
            }
        }
    }
`;

export const TagsMultiAutoComplete = withAutoComplete({
    response: data => ({ data: get(data, "pageBuilder.tags.data", []) }),
    search: query => query,
    query: searchTags
})(props => <UiMultiAutoComplete label="Tags" useSimpleValues allowFreeInput {...props} />);
