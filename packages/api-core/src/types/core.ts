import { Context as BaseContext } from "@webiny/api/types.js";
import type { SecurityContext, SecurityStorageOperations } from "~/types/security.js";
import type { TenancyContext, TenancyStorageOperations } from "~/types/tenancy.js";
import type { WcpContext } from "~/features/wcp/WcpContext/types.js";
import type { AdminUsersContext, AdminUsersStorageOperations } from "~/types/users.js";
import { SettingsStorageOperations } from "~/features/settings/index.js";

export type ApiCoreContext = BaseContext &
    SecurityContext &
    TenancyContext &
    WcpContext &
    AdminUsersContext;

export type ApiCoreStorageOperations = {
    usersStorageOperations: AdminUsersStorageOperations;
    tenancyStorageOperations: TenancyStorageOperations;
    securityStorageOperations: SecurityStorageOperations;
    settingsStorageOperations: SettingsStorageOperations.Interface;
};
