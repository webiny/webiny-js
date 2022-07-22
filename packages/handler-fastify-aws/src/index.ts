import { createAwsFastifyHandler, CreateAwsFastifyHandlerParams } from "~/handler";

export type CreateHandlerParams = CreateAwsFastifyHandlerParams;

export const createHandler = (params: CreateHandlerParams) => {
    return createAwsFastifyHandler(params);
};
