import { createAbstraction } from "@webiny/feature/admin";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

export interface IUpdateSettingsUseCase {
    execute(settings: IWebsiteBuilderSettings): Promise<void>;
}

export const UpdateSettingsUseCase = createAbstraction<IUpdateSettingsUseCase>(
    "WebsiteBuilder/UpdateSettingsUseCase"
);

export namespace UpdateSettingsUseCase {
    export type Interface = IUpdateSettingsUseCase;
    export type Params = IWebsiteBuilderSettings;
}
