import { Response } from "@webiny/graphql";

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
    getUnicorn: async (root, args, context) => {
        return new Response(unicorns.find(unicorn => unicorn.name === args.name));
    },
    getUnicorns: async (root, args, context) => {
        return new Response(unicorns);
    }
};

export default resolvers;
