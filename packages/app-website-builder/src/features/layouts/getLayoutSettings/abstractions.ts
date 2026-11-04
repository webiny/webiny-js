import { createAbstraction } from "@webiny/feature/admin";
import type { LayoutSettings } from "../shared/abstractions.js";

export interface IGetLayoutSettingsUseCase {
    // Load the layout settings (the default layout). They're also kept in the repository's observable `settings`.
    execute(): Promise<LayoutSettings>;
}

export const GetLayoutSettingsUseCase = createAbstraction<IGetLayoutSettingsUseCase>(
    "WebsiteBuilder/GetLayoutSettingsUseCase"
);

export namespace GetLayoutSettingsUseCase {
    export type Interface = IGetLayoutSettingsUseCase;
}
