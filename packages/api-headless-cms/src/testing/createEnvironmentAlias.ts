export const environmentAliasId = "ea1ea1ea1ea1ea1ea1ea1ea1";

export default ({ database, environmentId }) =>
    database.collection("CmsEnvironmentAlias").insert({
        id: environmentAliasId,
        name: "Production",
        slug: "production",
        description: 'This is the "production" environment alias',
        environment: environmentId
    });
