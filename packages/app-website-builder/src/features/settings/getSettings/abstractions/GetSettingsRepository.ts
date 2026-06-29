import { createAbstraction } from "@webiny/feature/admin";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

export interface IGetSettingsRepository {
    execute(): Promise<IWebsiteBuilderSettings>;
}

export const GetSettingsRepository = createAbstraction<IGetSettingsRepository>(
    "WebsiteBuilder/GetSettingsRepository"
);

export namespace GetSettingsRepository {
    export type Interface = IGetSettingsRepository;
    export type Result = IWebsiteBuilderSettings;
}
