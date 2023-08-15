import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types";

interface State {
    group: string;
    models: string[];
}

interface Params {
    client: ApolloClient<any>;
    state: State[];
}

interface ResponseData {
    groups: CmsGroup[];
    models: CmsModel[];
}

interface Response {
    error?: Partial<Error>;
    data?: ResponseData;
}

export const runExport = async ({ client, state }: Params): Promise<Response> => {
    const result = await client.query({
        query: gql`
            query ExportCmsStructure($targets: [ExportCmsStructureTargetInput!]!) {
                exportCmsStructure(targets: $targets) {
                    data
                    error {
                        message
                        code
                        data
                    }
                }
            }
        `,
        variables: {
            targets: state.map(item => {
                return {
                    id: item.group,
                    models: item.models
                };
            })
        }
    });

    if (result.errors?.length) {
        console.error(result.errors);
        return {
            error: result.errors[0]
        };
    } else if (!result.data?.exportCmsStructure) {
        const message = `There is no object returned from the exportCmsStructure query.`;
        console.error(message);
        return {
            error: {
                message
            }
        };
    }
    const { data, error } = result.data.exportCmsStructure;
    if (error) {
        console.error(error.message);
        return {
            error
        };
    } else if (!data) {
        const message = `There is no data returned from the exportCmsStructure query.`;
        return {
            error: {
                message
            }
        };
    }
    try {
        return {
            data: JSON.parse(data)
        };
    } catch (ex) {
        console.error(ex.message);
        return {
            error: ex
        };
    }
};
