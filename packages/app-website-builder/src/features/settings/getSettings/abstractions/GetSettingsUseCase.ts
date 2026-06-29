import { createAbstraction } from "@webiny/feature/admin";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

export interface IGetSettingsUseCase {
    execute(): Promise<IWebsiteBuilderSettings>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>(
    "WebsiteBuilder/GetSettingsUseCase"
);

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
    export type Result = IWebsiteBuilderSettings;
}
