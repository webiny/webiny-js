import gql from "graphql-tag";
import { i18n } from "@webiny/app/i18n";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-page-builder/admin/scopesList");

const GET_ENVIRONMENTS = gql`
    {
        cms {
            listEnvironments {
                data {
                    id
                    name
                    slug
                    contentModels {
                        modelId
                    }
                }
            }
        }
    }
`;

const generateScopes = envs => {
    const scopes = [];

    for (let env of envs) {
        const contentModels = env.contentModels;
        for (let apiType of ["read", "preview"]) {
            for (let contentModel of contentModels) {
                const modelId = contentModel.modelId;
                const currentScope = `cms:${apiType}:${env.slug}:${modelId}`;

                scopes.push({
                    scope: currentScope,
                    title: `CMS ${modelId}`,
                    description: `Allows CRUD operations on Model "${modelId}" of environment ${env.slug}`
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
            // console.log(envsResponse);
            const envs = envsResponse.data.cms.listEnvironments.data;
            // console.log(envs);
            const scopes = generateScopes(envs);

            console.log(scopes);

            return scopes;
            return [
                {
                    scope: "cms:test:scope:one",
                    title: t`test title`,
                    description: t`test description`
                }
            ];
        }
    } as SecurityScopesListPlugin
];
