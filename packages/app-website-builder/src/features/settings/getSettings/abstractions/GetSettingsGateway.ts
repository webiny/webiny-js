import { createAbstraction } from "@webiny/feature/admin";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

export interface IGetSettingsGateway {
    execute(): Promise<IWebsiteBuilderSettings | undefined>;
}

export const GetSettingsGateway = createAbstraction<IGetSettingsGateway>(
    "WebsiteBuilder/GetSettingsGateway"
);

export namespace GetSettingsGateway {
    export type Interface = IGetSettingsGateway;
    export type Result = IWebsiteBuilderSettings | undefined;
}
