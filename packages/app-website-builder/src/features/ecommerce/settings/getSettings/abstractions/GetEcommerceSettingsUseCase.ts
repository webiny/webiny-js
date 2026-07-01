import { createAbstraction } from "@webiny/feature/admin";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export interface IGetEcommerceSettingsUseCase {
    execute(): Promise<AllEcommerceSettings>;
}

export const GetEcommerceSettingsUseCase = createAbstraction<IGetEcommerceSettingsUseCase>(
    "WebsiteBuilder/GetEcommerceSettingsUseCase"
);

export namespace GetEcommerceSettingsUseCase {
    export type Interface = IGetEcommerceSettingsUseCase;
    export type Result = AllEcommerceSettings;
}
