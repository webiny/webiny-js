import { createAbstraction } from "@webiny/feature/admin";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export interface IUpdateEcommerceSettingsUseCase {
    execute(settings: AllEcommerceSettings): Promise<void>;
}

export const UpdateEcommerceSettingsUseCase = createAbstraction<IUpdateEcommerceSettingsUseCase>(
    "WebsiteBuilder/UpdateEcommerceSettingsUseCase"
);

export namespace UpdateEcommerceSettingsUseCase {
    export type Interface = IUpdateEcommerceSettingsUseCase;
    export type Params = AllEcommerceSettings;
}
