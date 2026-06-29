import { createAbstraction } from "@webiny/feature/admin";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

export interface IUpdateSettingsRepository {
    execute(settings: IWebsiteBuilderSettings): Promise<void>;
}

export const UpdateSettingsRepository = createAbstraction<IUpdateSettingsRepository>(
    "WebsiteBuilder/UpdateSettingsRepository"
);

export namespace UpdateSettingsRepository {
    export type Interface = IUpdateSettingsRepository;
    export type Params = IWebsiteBuilderSettings;
}
