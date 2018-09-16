// @flow
import gql from "graphql-tag";
import _ from "lodash";

type FindOneParams = {
    type: string,
    fields: string
};
const generateListQuery = (params: FindOneParams) => {
    let query = `
        one(id: $id) {
            ${params.fields}
        }
    `;

    query = JSON.stringify(_.set({}, params.type, " { {fields} }"))
        .replace(/"/g, " ")
        .replace(/:/g, " ")
        .replace("{fields}", query);

    query = `query one($id: String!) ${query}`;
    return gql`
        ${query}
    `;
};

export default generateListQuery;
