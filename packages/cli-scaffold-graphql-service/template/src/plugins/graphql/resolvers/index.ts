const unicorns = [
    {
        id: "sdjigashoi3_1",
        name: "Phoenix",
        weight: 230
    },
    {
        id: "sdjigashoi3_2",
        name: "Starlight",
        weight: 215
    }
];

const resolvers = {
    Query: {
        getUnicorn: async (root, args, context) => {
            return unicorns.find(unicorn => unicorn.name === args.name);
        },
        getUnicorns: async (root, args, context) => {
            return unicorns;
        }
    }
};

export default resolvers;
