export default ({ database, environmentId }) =>
    database.collection("CmsEnvironmentAlias").insert({
        id: "ea1ea1ea1ea1ea1ea1ea1ea1",
        name: "Production",
        slug: "production",
        description: 'This is the "production" environment alias',
        environment: environmentId
    });
