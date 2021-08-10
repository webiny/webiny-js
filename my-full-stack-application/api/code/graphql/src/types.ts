import { HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ClientContext } from "@webiny/handler-client/types";

export interface Context extends HandlerContext, HttpContext, ArgsContext, ClientContext {}
