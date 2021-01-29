export const commonFieldResolvers = () => ({
    id: entry => (entry.id ? entry.id : null),
    createdBy: entry => (entry.createdBy ? entry.createdBy : null)
});
