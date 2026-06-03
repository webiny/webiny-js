import type { Container } from "@webiny/di";

export type NextFunction = (event?: any) => Promise<any>;
export type HandlerSetup = (container: Container) => void | Promise<void>;
