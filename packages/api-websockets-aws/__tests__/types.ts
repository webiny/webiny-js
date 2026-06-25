import type { Context as SocketsContext } from "@webiny/api-websockets";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export interface Context extends SocketsContext, ApiCoreContext {}
