import { createAbstraction } from "@webiny/feature/admin";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export interface IUpdateEcommerceSettingsRepository {
    execute(settings: AllEcommerceSettings): Promise<void>;
}

export const UpdateEcommerceSettingsRepository =
    createAbstraction<IUpdateEcommerceSettingsRepository>(
        "WebsiteBuilder/UpdateEcommerceSettingsRepository"
    );

export namespace UpdateEcommerceSettingsRepository {
    export type Interface = IUpdateEcommerceSettingsRepository;
    export type Params = AllEcommerceSettings;
}
