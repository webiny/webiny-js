// @flow
import * as React from "react";
import { MultiAutoComplete as UiMultiAutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import { compose } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";

const listTags = gql`
    query ListTags($search: SearchInput) {
        cms {
            tags: listTags(search: $search) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

export const SimpleTagsMultiAutoComplete = compose(
    withAutoComplete({
        response: data => ({ data: get(data, "cms.tags.data", []).map(item => item.name) }),
        search: query => ({ query, fields: ["name"] }),
        query: listTags
    })
)(props => <UiMultiAutoComplete label="Tags" useSimpleValues allowFreeInput {...props} />);

export const TagsMultiAutoComplete = compose(
    withAutoComplete({
        response: data => get(data, "cms.tags"),
        search: query => ({ query, fields: ["name"] }),
        query: listTags
    })
)(props => <UiMultiAutoComplete label="Tags" allowFreeInput {...props} />);
