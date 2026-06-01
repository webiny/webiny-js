import { createAbstraction } from "@webiny/feature/admin";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";

export interface GetRedirectParams {
    id: string;
}

export interface IGetRedirectRepository {
    execute(params: GetRedirectParams): RedirectDto | undefined;
}

export const GetRedirectRepository = createAbstraction<IGetRedirectRepository>(
    "WebsiteBuilder/GetRedirectRepository"
);

export namespace GetRedirectRepository {
    export type Interface = IGetRedirectRepository;
}

export interface IGetRedirectUseCase {
    execute(params: GetRedirectParams): RedirectDto | undefined;
}

export const GetRedirectUseCase = createAbstraction<IGetRedirectUseCase>(
    "WebsiteBuilder/GetRedirectUseCase"
);

export namespace GetRedirectUseCase {
    export type Interface = IGetRedirectUseCase;
}
