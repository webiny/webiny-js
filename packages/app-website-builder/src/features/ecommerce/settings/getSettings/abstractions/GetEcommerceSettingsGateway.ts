import { createAbstraction } from "@webiny/feature/admin";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export interface IGetEcommerceSettingsGateway {
    execute(): Promise<AllEcommerceSettings>;
}

export const GetEcommerceSettingsGateway = createAbstraction<IGetEcommerceSettingsGateway>(
    "WebsiteBuilder/GetEcommerceSettingsGateway"
);

export namespace GetEcommerceSettingsGateway {
    export type Interface = IGetEcommerceSettingsGateway;
    export type Result = AllEcommerceSettings;
}
