import { createAbstraction } from "@webiny/feature/admin";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

export interface IUpdateSettingsGateway {
    execute(settings: IWebsiteBuilderSettings): Promise<void>;
}

export const UpdateSettingsGateway = createAbstraction<IUpdateSettingsGateway>(
    "WebsiteBuilder/UpdateSettingsGateway"
);

export namespace UpdateSettingsGateway {
    export type Interface = IUpdateSettingsGateway;
    export type Params = IWebsiteBuilderSettings;
}
