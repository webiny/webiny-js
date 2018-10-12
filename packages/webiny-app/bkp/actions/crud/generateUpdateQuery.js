// @flow
import gql from "graphql-tag";
import _ from "lodash";

type UpdateParams = {
    type: string,
    fields: string
};

const generateUpdateQuery = (params: UpdateParams) => {
    let query = JSON.stringify(_.set({}, params.type, " { {fields} }"))
        .replace(/"/g, " ")
        .replace(/:/g, " ")
        .replace("{fields}", `update(id: $id, data: $data) { ${params.fields} }`);

    query = `query updateType($id: String!, $data: JSON!) ${query}`;

    return gql`
        ${query}
    `;
};

export default generateUpdateQuery;
