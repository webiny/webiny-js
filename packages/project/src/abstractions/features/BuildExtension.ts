import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IBuildExtension {
    execute(): void | Promise<void>;
}

export const BuildExtension = createAbstraction<IBuildExtension>("BuildExtension");

export namespace BuildExtension {
    export type Interface = IBuildExtension;
}
