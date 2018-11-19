// @flow
import * as React from "react";
import { MultiAutoComplete } from "webiny-ui/AutoComplete";
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

const TagsAutoComplete = props => (
    <MultiAutoComplete label="Tags" useSimpleValue allowFreeInput {...props} />
);

export default compose(
    withAutoComplete({
        response: data => ({ data: get(data, "cms.tags.data", []).map(item => item.name) }),
        search: query => ({ query, fields: ["name"] }),
        query: listTags
    })
)(TagsAutoComplete);
