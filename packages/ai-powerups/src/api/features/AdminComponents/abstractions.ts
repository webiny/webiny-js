import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

export interface AdminComponent {
    id: string;
    kind: string;
    name: string;
    description: string;
    source: string;
    enabled: boolean;
}

export interface CreateAdminComponentParams {
    kind: string;
    name: string;
    description: string;
    source: string;
}

export interface IAdminComponentModelProvider {
    get(): Promise<CmsModel>;
}

export const AdminComponentModelProvider = createAbstraction<IAdminComponentModelProvider>(
    "AdminComponentModelProvider"
);

export namespace AdminComponentModelProvider {
    export type Interface = IAdminComponentModelProvider;
}

export interface IAdminComponentsRepository {
    create(params: CreateAdminComponentParams): Promise<AdminComponent>;
    listEnabled(kind: string): Promise<AdminComponent[]>;
}

export const AdminComponentsRepository = createAbstraction<IAdminComponentsRepository>(
    "AdminComponentsRepository"
);

export namespace AdminComponentsRepository {
    export type Interface = IAdminComponentsRepository;
    export type Component = AdminComponent;
    export type CreateParams = CreateAdminComponentParams;
}
