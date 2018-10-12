// @flow
import gql from "graphql-tag";
import _ from "lodash";

type ListQueryParams = {
    type: string,
    fields: string
};

const generateListQuery = (params: ListQueryParams) => {
    let query = `
        list(where: $where, sort: $sort, page: $page, perPage: $perPage, search: $search) {
            data {
                ${params.fields}
            }
            meta {
                count
                totalCount
                from
                to
                page
                totalPages
                perPage
                nextPage
                previousPage
            }
        }
    `;

    query = JSON.stringify(_.set({}, params.type, " { {fields} }"))
        .replace(/"/g, " ")
        .replace(/:/g, " ")
        .replace("{fields}", query);

    query = `query typeList($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) ${query}`;

    return gql`
        ${query}
    `;
};

export default generateListQuery;
