import { Container } from "@webiny/di";
import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IInitProjectSdkService {
    execute(container: Container): Promise<void>;
}

export const InitProjectSdkService =
    createAbstraction<IInitProjectSdkService>("InitProjectSdkService");

export namespace InitProjectSdkService {
    export type Interface = IInitProjectSdkService;
}
