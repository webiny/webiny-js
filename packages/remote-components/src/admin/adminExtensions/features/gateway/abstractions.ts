import { createAbstraction } from "@webiny/feature/admin";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";

export interface IAdminExtensionsGateway {
    /** Enabled extensions of one kind. What every signed-in user's admin loads. */
    listEnabled(kind: AdminExtensionKind): Promise<AdminExtensionDto[]>;
    /** Every extension, enabled or not, for whoever manages them. */
    list(): Promise<AdminExtensionDto[]>;
    setEnabled(id: string, enabled: boolean): Promise<AdminExtensionDto>;
    delete(id: string): Promise<void>;
}

export const AdminExtensionsGateway = createAbstraction<IAdminExtensionsGateway>(
    "RemoteComponents/AdminExtensionsGateway"
);

export namespace AdminExtensionsGateway {
    export type Interface = IAdminExtensionsGateway;
}
