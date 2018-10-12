// @flow
import gql from "graphql-tag";
import _ from "lodash";

type CreateParams = {
    type: string,
    fields: string
};

const generateCreateQuery = (params: CreateParams) => {
    let query = JSON.stringify(_.set({}, params.type, " { {fields} }"))
        .replace(/"/g, " ")
        .replace(/:/g, " ")
        .replace("{fields}", `create(data: $data) { ${params.fields} }`);

    query = `query createType($data: JSON!) ${query}`;

    return gql`
        ${query}
    `;
};

export default generateCreateQuery;
