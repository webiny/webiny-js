import type { Container } from "@webiny/di";
import type { EventContext } from "./EventHandler.js";

export type NextFunction = (ctx?: EventContext) => Promise<any>;
export type HandlerSetup = (container: Container) => void | Promise<void>;
