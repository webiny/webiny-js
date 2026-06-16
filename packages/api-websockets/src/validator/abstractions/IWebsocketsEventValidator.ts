import type { IWebsocketsEvent, IWebsocketsEventData } from "~/types.js";

export interface IWebsocketsEventValidator {
    validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>>;
}
