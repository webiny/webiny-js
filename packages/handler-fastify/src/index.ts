import { createFastifyHandler, CreateFastifyHandlerParams } from "~/handler";

export type CreateHandlerParams = CreateFastifyHandlerParams;

export const createHandler = (params: CreateHandlerParams) => {
    return createFastifyHandler(params);
};

export * from "~/plugins/EventPlugin";
