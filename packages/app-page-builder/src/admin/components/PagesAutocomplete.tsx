import React, { useState } from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import { get } from "lodash";
import { useQuery } from "react-apollo";
import { debounce } from "lodash";

// We utilize the same "listPages" GraphQL field.
const GET_PUBLISHED_PAGE = gql`
    query GetPublishedPage($id: ID) {
        pageBuilder {
            getPublishedPage(id: $id) {
                data {
                    uniquePageId
                    status
                    title
                }
            }
        }
    }
`;

const LIST_PUBLISHED_PAGES = gql`
    query ListPublishedPages($search: PbListPagesSearchInput) {
        pageBuilder {
            listPublishedPages(search: $search) {
                data {
                    uniquePageId
                    status
                    title
                }
            }
        }
    }
`;

export function PagesAutocomplete(props) {
    const [query, setQuery] = useState();
    const listPublishedPagesQuery = useQuery(LIST_PUBLISHED_PAGES, {
        skip: !query,
        variables: {
            search: {
                query
            }
        }
    });

    const getPublishedPageQuery = useQuery(GET_PUBLISHED_PAGE, {
        skip: !props.value,
        variables: { id: props.value }
    });

    const publishedPages = get(
        listPublishedPagesQuery,
        "data.pageBuilder.listPublishedPages.data",
        []
    );
    const publishedPage = get(getPublishedPageQuery, "data.pageBuilder.getPublishedPage.data");

    return (
        <AutoComplete
            {...props}
            options={publishedPages}
            onInput={debounce(query => query && setQuery(query), 250)}
            valueProp={"uniquePageId"}
            textProp={"title"}
            value={publishedPage}
        />
    );
}
