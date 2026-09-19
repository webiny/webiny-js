import { createAbstraction } from "@webiny/feature/admin";

export interface AdminComponent {
    id: string;
    kind: string;
    name: string;
    description: string;
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
