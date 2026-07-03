import { createAbstraction } from "@webiny/feature/admin";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export interface IUpdateEcommerceSettingsGateway {
    execute(settings: AllEcommerceSettings): Promise<void>;
}

export const UpdateEcommerceSettingsGateway = createAbstraction<IUpdateEcommerceSettingsGateway>(
    "WebsiteBuilder/UpdateEcommerceSettingsGateway"
);

export namespace UpdateEcommerceSettingsGateway {
    export type Interface = IUpdateEcommerceSettingsGateway;
    export type Params = AllEcommerceSettings;
}
