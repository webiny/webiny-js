import type { DbContext } from "@webiny/handler-db/types.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export type Context = ApiCoreContext & DbContext;
