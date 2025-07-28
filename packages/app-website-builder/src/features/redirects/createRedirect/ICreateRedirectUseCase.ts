import type { WbLocation } from "~/types.js";
import { Redirect } from "~/domain/Redirect";

export interface CreateRedirectParams {
    location: WbLocation;
    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}

export interface ICreateRedirectUseCase {
    execute: (params: CreateRedirectParams) => Promise<Redirect>;
}
