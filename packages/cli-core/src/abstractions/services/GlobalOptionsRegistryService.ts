import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { GlobalCliOption } from "~/abstractions/index.js";

export interface IGlobalOptionsRegistryService {
    execute(): GlobalCliOption.Interface[];
}

export const GlobalOptionsRegistryService = createAbstraction<IGlobalOptionsRegistryService>(
    "GlobalOptionsRegistryService"
);

export namespace GlobalOptionsRegistryService {
    export type Interface = IGlobalOptionsRegistryService;
}
