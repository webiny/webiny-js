import React from "react";
import { AutoComplete, AutoCompleteProps } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import get from "lodash/get";
import { useQuery } from "@apollo/react-hooks";

const GET_CATEGORY = gql`
    query GetCategory($slug: String!) {
        pageBuilder {
            getCategory(slug: $slug) {
                data {
                    slug
                    name
                }
            }
        }
    }
`;

const LIST_CATEGORIES = gql`
    query ListCategories {
        pageBuilder {
            listCategories {
                data {
                    slug
                    name
                }
            }
        }
    }
`;

type CategoriesAutocompleteProps = Partial<AutoCompleteProps>;
export const CategoriesAutocomplete = (props: CategoriesAutocompleteProps) => {
    const listCategoriesQuery = useQuery(LIST_CATEGORIES);
    const getCategoryQuery = useQuery(GET_CATEGORY, {
        skip: !props.value,
        variables: { slug: props.value }
    });

    const publishedPages = get(listCategoriesQuery, "data.pageBuilder.listCategories.data", []);
    const publishedPage = get(getCategoryQuery, "data.pageBuilder.getCategory.data");

    return (
        <AutoComplete
            {...props}
            options={publishedPages}
            valueProp={"slug"}
            textProp={"name"}
            value={publishedPage}
        />
    );
};
