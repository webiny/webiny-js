// @flow
import gql from "graphql-tag";
import _ from "lodash";

type DeleteParams = {
    type: string,
    fields: string
};

const generateListQuery = (params: DeleteParams) => {
    let query = JSON.stringify(_.set({}, params.type, " { {fields} }"))
        .replace(/"/g, " ")
        .replace(/:/g, " ")
        .replace("{fields}", `delete(id: $id)`);

    query = `query deleteType ($id: String!) ${query}`;

    return gql`
        ${query}
    `;
};

export default generateListQuery;
