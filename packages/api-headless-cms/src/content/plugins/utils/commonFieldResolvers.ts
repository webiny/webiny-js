export const commonFieldResolvers = () => ({
    id: entry => (entry.id ? entry.id : null)
});
