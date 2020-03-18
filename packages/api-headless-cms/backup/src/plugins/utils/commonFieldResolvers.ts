export const commonFieldResolvers = () => ({
    id: entry => (entry.id ? entry.id : null),
    createdBy: entry => {
        return !entry.createdBy ? null : { __typename: "SecurityUser", id: entry.createdBy };
    },
    updatedBy: entry => {
        return !entry.createdBy ? null : { __typename: "SecurityUser", id: entry.createdBy };
    }
});
