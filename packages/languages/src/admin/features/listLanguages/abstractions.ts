import { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import { createAbstraction } from "@webiny/feature/admin";

//
// DTO
//
export interface LanguageDto {
    id: string;
    code: string;
    name: string;
    direction?: "ltr" | "rtl";
    isDefault?: boolean;
    enabled?: boolean;
}

//
// Cache
//
export const LanguagesCache = createAbstraction<IListCache<LanguageDto>>(
    "Languages/LanguagesCache"
);

export namespace LanguagesCache {
    export type Interface = IListCache<LanguageDto>;
}

//
// UseCase
//
export interface IListLanguagesUseCase {
    execute(): Promise<LanguageDto[]>;
}

export const ListLanguagesUseCase = createAbstraction<IListLanguagesUseCase>(
    "Languages/ListLanguagesUseCase"
);

export namespace ListLanguagesUseCase {
    export type Interface = IListLanguagesUseCase;
}

//
// Repository
//
export interface IListLanguagesRepository {
    execute(): Promise<LanguageDto[]>;
    getLanguages(): LanguageDto[];
}

export const ListLanguagesRepository = createAbstraction<IListLanguagesRepository>(
    "Languages/ListLanguagesRepository"
);

export namespace ListLanguagesRepository {
    export type Interface = IListLanguagesRepository;
}

//
// Gateway
//
export interface IListLanguagesGateway {
    execute(): Promise<LanguageDto[]>;
}

export const ListLanguagesGateway = createAbstraction<IListLanguagesGateway>(
    "Languages/ListLanguagesGateway"
);

export namespace ListLanguagesGateway {
    export type Interface = IListLanguagesGateway;
}
