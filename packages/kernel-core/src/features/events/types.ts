import type { Container } from "@webiny/di";
import type { InputContext } from "./InputHandler.js";

export type NextFunction = (ctx?: InputContext) => Promise<any>;
export type KernelSetup = (container: Container) => void | Promise<void>;
