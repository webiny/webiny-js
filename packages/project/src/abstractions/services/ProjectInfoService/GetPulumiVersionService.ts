import { Abstraction } from "@webiny/di";

export type PulumiVersion = string;
export type PulumiAwsVersion = string;
export type IGetPulumiVersionServiceResult = [PulumiVersion, PulumiAwsVersion];

interface IGetPulumiVersionService {
    execute(): IGetPulumiVersionServiceResult;
}

export const GetPulumiVersionService = new Abstraction<IGetPulumiVersionService>(
    "GetPulumiVersionService"
);

export namespace GetPulumiVersionService {
    export type Interface = IGetPulumiVersionService;

    export type Result = IGetPulumiVersionServiceResult;
}
