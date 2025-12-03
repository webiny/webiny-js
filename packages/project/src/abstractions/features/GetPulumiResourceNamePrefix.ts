import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGetPulumiResourceNamePrefix {
    execute(): Promise<string>;
}

export const GetPulumiResourceNamePrefix = createAbstraction<IGetPulumiResourceNamePrefix>(
    "GetPulumiResourceNamePrefix"
);

export namespace GetPulumiResourceNamePrefix {
    export type Interface = IGetPulumiResourceNamePrefix;
}
