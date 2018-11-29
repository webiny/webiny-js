// @flow
const { print } = require("graphql/language/printer");

const getUserQuery = fields => `
query GetUser($id: ID!) { 
    security { 
        getUser(id: $id) {
            data ${fields}
        } 
    }
}`;

export default (attr: string) => async (parent, args, ctx, info) => {
    if (!parent[attr]) {
        return null;
    }

    const { data } = await ctx.graphql({
        source: getUserQuery(print(info.fieldNodes[0].selectionSet)),
        variables: { id: parent[attr] },
        info
    });

    return data.security.getUser.data;
};
