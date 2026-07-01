import { createAbstraction } from "@webiny/feature/admin";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export interface IGetEcommerceSettingsRepository {
    execute(): Promise<AllEcommerceSettings>;
}

export const GetEcommerceSettingsRepository = createAbstraction<IGetEcommerceSettingsRepository>(
    "WebsiteBuilder/GetEcommerceSettingsRepository"
);

export namespace GetEcommerceSettingsRepository {
    export type Interface = IGetEcommerceSettingsRepository;
    export type Result = AllEcommerceSettings;
}
