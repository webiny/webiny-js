import { createAbstraction } from "~/abstractions/createAbstraction.js";

export type PulumiVersion = string;
export type PulumiAwsVersion = string;
export type IGetPulumiVersionServiceResult = [PulumiVersion, PulumiAwsVersion];

interface IGetPulumiVersionService {
    execute(): IGetPulumiVersionServiceResult;
}

export const GetPulumiVersionService = createAbstraction<IGetPulumiVersionService>(
    "GetPulumiVersionService"
);

export namespace GetPulumiVersionService {
    export type Interface = IGetPulumiVersionService;

    export type Result = IGetPulumiVersionServiceResult;
}
