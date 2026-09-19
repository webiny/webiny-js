import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

/** Which fields a renderer may be selected for. */
export type AdminComponentAppliesTo = "single" | "list" | "both";

export interface AdminComponent {
    id: string;
    kind: string;
    name: string;
    label: string;
    description: string;
    fieldType: string;
    appliesTo: AdminComponentAppliesTo;
    source: string;
    enabled: boolean;
}

export interface CreateAdminComponentParams {
    kind: string;
    name: string;
    label: string;
    description: string;
    fieldType: string;
    appliesTo: AdminComponentAppliesTo;
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
