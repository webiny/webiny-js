const getUserQuery = `
query GetUser($id: ID!) { 
    security { 
        getUser(id: $id) {
            data { 
                id
                firstName 
                lastName 
                email 
            }
        } 
    }
}`;

export default (attr: string) => async (parent, args, ctx) => {
    if (!parent[attr]) {
        return null;
    }

    const { data } = await ctx.graphql({
        source: getUserQuery,
        variables: { id: parent[attr] }
    });

    return data.security.getUser.data;
};
