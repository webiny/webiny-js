import { createAbstraction } from "@webiny/feature/api";
import type { Request as IRequest } from "~/types.js";

export const Request = createAbstraction<IRequest>("Request");

export namespace Request {
    export type Interface = IRequest;
}
