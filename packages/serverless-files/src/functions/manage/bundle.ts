import { buildFunction as build } from "@webiny/project-utils";

export const buildFunction = async (options, context) => {
    await build(options, context);
};
