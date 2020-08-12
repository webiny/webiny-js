// TODO: send graphql query to `security` service
export const commonFieldResolvers = () => ({
    id: entry => (entry.id ? entry.id : null)
});
