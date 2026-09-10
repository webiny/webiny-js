import { createAbstraction } from "@webiny/feature/admin";
import type { IAuditLog } from "~/types.js";

export interface IAuditLogDetailsVm {
    auditLog: IAuditLog | null;
    content: Record<string, unknown>;
}

export interface IAuditLogDetailsPresenter {
    readonly vm: IAuditLogDetailsVm;
    init(auditLog: IAuditLog): void;
}

export const AuditLogDetailsPresenter = createAbstraction<IAuditLogDetailsPresenter>(
    "AuditLogDetailsPresenter"
);

export namespace AuditLogDetailsPresenter {
    export type Interface = IAuditLogDetailsPresenter;
    export type ViewModel = IAuditLogDetailsVm;
}
