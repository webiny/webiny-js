import { Container } from "@webiny/di";
import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";

export interface IInitProjectSdkService {
    execute(params: IInitProjectSdkService.Params): Promise<void>;
}

export const InitProjectSdkService = createAbstraction<IInitProjectSdkService>(
    "InitProjectSdkService"
);

export namespace InitProjectSdkService {
    export type Interface = IInitProjectSdkService;

    export type Params = {
        container: Container;
        projectExtensions: IProjectConfigModel;
    };
}
