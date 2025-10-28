import { Context as BaseContext } from "@webiny/api/types.js";
import type { SecurityContext } from "~/types/security.js";
import type { TenancyContext } from "~/types/tenancy.js";
import type { WcpContext } from "~/features/wcp/WcpContext/types.js";
import type { AdminUsersContext } from "~/types/users.js";

export type ApiCoreContext = BaseContext &
    SecurityContext &
    TenancyContext &
    WcpContext &
    AdminUsersContext;
