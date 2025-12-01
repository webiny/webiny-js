import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { GlobalOption } from "~/abstractions/index.js";

export interface IGlobalOptionsRegistryService {
    execute(): GlobalOption.Interface[];
}

export const GlobalOptionsRegistryService = createAbstraction<IGlobalOptionsRegistryService>(
    "GlobalOptionsRegistryService"
);

export namespace GlobalOptionsRegistryService {
    export type Interface = IGlobalOptionsRegistryService;
}

