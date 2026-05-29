import { createAbstraction } from "@webiny/feature/admin";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

export interface UpdateRedirectParams {
    id: string;
    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}

export interface IUpdateRedirectGateway {
    execute(params: UpdateRedirectParams): Promise<Redirect>;
}

export const UpdateRedirectGateway = createAbstraction<IUpdateRedirectGateway>(
    "WebsiteBuilder/UpdateRedirectGateway"
);

export namespace UpdateRedirectGateway {
    export type Interface = IUpdateRedirectGateway;
}

export interface IUpdateRedirectUseCase {
    execute(params: UpdateRedirectParams): Promise<Redirect>;
}

export const UpdateRedirectUseCase = createAbstraction<IUpdateRedirectUseCase>(
    "WebsiteBuilder/UpdateRedirectUseCase"
);

export namespace UpdateRedirectUseCase {
    export type Interface = IUpdateRedirectUseCase;
}
