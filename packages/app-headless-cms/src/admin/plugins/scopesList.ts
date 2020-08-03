import gql from "graphql-tag";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const GET_ENVIRONMENTS = gql`
    {
        cms {
            listEnvironments {
                data {
                    id
                    name
                    slug
                    contentModels {
                        name
                        modelId
                    }
                }
            }
        }
    }
`;

const generateScopes = envs => {
    const scopes = [];

    for (const env of envs) {
        const contentModels = env.contentModels;
        for (const apiType of ["read", "preview"]) {
            for (const contentModel of contentModels) {
                const modelId = contentModel.modelId;
                const currentScope = `cms:${apiType}:${env.slug}:${modelId}`;

                scopes.push({
                    scope: currentScope,
                    title: `${contentModel.name} (${modelId})`,
                    description: `Allows CRUD operations on model "${modelId}" of environment ${env.slug}`
                });
            }
        }
    }

    return scopes;
};

export default [
    {
        name: "security-scopes-list-app-headless-cms",
        type: "security-scopes-list",
        scopes: async ({ apolloClient }) => {
            const envsResponse = await apolloClient.query({ query: GET_ENVIRONMENTS });
            const envs = envsResponse.data.cms.listEnvironments.data;
            console.log("env.contentModels", envs);
            return generateScopes(envs);
        }
    } as SecurityScopesListPlugin
];
