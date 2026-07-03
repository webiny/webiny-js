import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsEvent, IWebsocketsEventData } from "~/types.js";

export interface IWebsocketsEventValidator {
    validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>>;
}

export const WebsocketsEventValidator = createAbstraction<IWebsocketsEventValidator>(
    "WebsocketsEventValidator"
);

export namespace WebsocketsEventValidator {
    export type Interface = IWebsocketsEventValidator;
}
