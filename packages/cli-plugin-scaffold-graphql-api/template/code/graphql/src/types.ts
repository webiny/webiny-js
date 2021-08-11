import { HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ClientContext } from "@webiny/handler-client/types";

// The context object that is passed to your GraphQL resolver functions.
// Feel free to extend it with additional context interfaces, if needed.
// Note: do not rename it, as existing scaffolding utilities may rely on it.
export interface Context extends HandlerContext, HttpContext, ArgsContext, ClientContext {}
