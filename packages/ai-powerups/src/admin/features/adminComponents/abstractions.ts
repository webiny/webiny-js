import { createAbstraction } from "@webiny/feature/admin";

export type AdminComponentAppliesTo = "single" | "list" | "both";

export interface AdminComponent {
    id: string;
    kind: string;
    name: string;
    label: string;
    description: string;
    /** CMS field type this renderer may be selected for, e.g. `text`. */
    fieldType: string;
    appliesTo: AdminComponentAppliesTo;
    source: string;
}

export interface IListAdminComponentsGateway {
    execute(kind: string): Promise<AdminComponent[]>;
}

export const ListAdminComponentsGateway = createAbstraction<IListAdminComponentsGateway>(
    "AiPowerUps/ListAdminComponentsGateway"
);

export namespace ListAdminComponentsGateway {
    export type Interface = IListAdminComponentsGateway;
    export type Component = AdminComponent;
}
