import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";

const I18N_FIELD = /* GraphQL */ `
    {
        values {
            value
            locale
        }
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

const createFieldsList = contentModel => {
    const fields = contentModel.fields.map(field => {
        return `${field.fieldId} ${I18N_FIELD}`;
    });

    return fields.join("\n");
};

const createReadQuery = ({ model, ucFirstModelId }) => {
    return /* GraphQL */ `
        query get${ucFirstModelId}($id: ID) {
            get${ucFirstModelId}(where: { id: $id }) {
                data {
                    id
                    ${createFieldsList(model)}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

const createListQuery = ({ model, ucFirstModelId }) => {
    return /* GraphQL */ `
        query list${pluralize(
            ucFirstModelId
        )}($where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $page: Int, $perPage: Int) {
            list${pluralize(ucFirstModelId)}(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage) {
                data {
                    id
                    ${createFieldsList(model)}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

const createDeleteMutation = ({ ucFirstModelId }) => {
    return /* GraphQL */ `
        mutation delete${ucFirstModelId}($id: ID) {
            delete${ucFirstModelId}(where: { id: $id }) {
                data
                error ${ERROR_FIELD}
            }
        }
    `;
};

const createCreateMutation = ({ model, ucFirstModelId }) => {
    return /* GraphQL */ `
        mutation create${ucFirstModelId}($data: ${ucFirstModelId}Input!) {
            create${ucFirstModelId}(data: $data) {
                data {
                    id
                    ${createFieldsList(model)}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

const createUpdateMutation = ({ model, ucFirstModelId }) => {
    return /* GraphQL */ `
        mutation update${ucFirstModelId}($id: ID!, $data: ${ucFirstModelId}Input!) {
            update${ucFirstModelId}(where: { id: $id }, data: $data) {
                data {
                    id
                    ${createFieldsList(model)}
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

export default function createCrudQueriesAndMutations(model) {
    const ucFirstModelId = upperFirst(model.modelId);

    return {
        delete: createDeleteMutation({ ucFirstModelId }),
        read: createReadQuery({ model, ucFirstModelId }),
        create: createCreateMutation({ model, ucFirstModelId }),
        update: createUpdateMutation({ model, ucFirstModelId }),
        list: createListQuery({ model, ucFirstModelId })
    };
}
