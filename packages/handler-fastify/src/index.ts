import { createFastifyHandler, CreateFastifyHandlerParams } from "~/handler";

export type CreateHandlerParams = CreateFastifyHandlerParams;

export const createHandler = <R = Record<string, any>>(params: CreateHandlerParams) => {
    return createFastifyHandler<R>(params);
};

export * from "~/plugins/EventPlugin";
