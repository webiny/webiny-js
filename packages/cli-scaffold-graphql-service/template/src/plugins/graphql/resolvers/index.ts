import { Response } from "@webiny/api";

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

export const getUnicorn = async (root, args, context) => {
    console.log("Args = \n\n");
    console.log(args);
    console.log(args.name);
    return new Response(unicorns.find(unicorn => unicorn.name === args.name));
};

export const getUnicorns = async (root, args, context) => {
    return new Response(unicorns);
};
