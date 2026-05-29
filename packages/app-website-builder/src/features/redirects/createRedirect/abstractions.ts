import { createAbstraction } from "@webiny/feature/admin";
import type { Redirect } from "~/domain/Redirect/Redirect.js";
import type { WbLocation } from "~/types.js";

export interface CreateRedirectGatewayParams {
    location: WbLocation;
    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}

export interface ICreateRedirectGateway {
    execute(params: CreateRedirectGatewayParams): Promise<Redirect>;
}

export const CreateRedirectGateway = createAbstraction<ICreateRedirectGateway>(
    "WebsiteBuilder/CreateRedirectGateway"
);

export namespace CreateRedirectGateway {
    export type Interface = ICreateRedirectGateway;
}

export interface CreateRedirectUseCaseParams {
    location: WbLocation;
    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}

export interface ICreateRedirectUseCase {
    execute(params: CreateRedirectUseCaseParams): Promise<Redirect>;
}

export const CreateRedirectUseCase = createAbstraction<ICreateRedirectUseCase>(
    "WebsiteBuilder/CreateRedirectUseCase"
);

export namespace CreateRedirectUseCase {
    export type Interface = ICreateRedirectUseCase;
}
