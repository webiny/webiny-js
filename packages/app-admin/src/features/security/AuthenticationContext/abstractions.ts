import { createAbstraction } from "@webiny/feature/admin";
import type { Identity } from "~/domain/Identity.js";
import type { IdentityDTO } from "./types.js";

type IIdToken = string;

type IIdTokenProvider = () => Promise<IIdToken | undefined> | IIdToken | undefined;

type ILogoutCallback = () => Promise<void> | void;

export interface IAuthenticationContext {
    login(identityType: string): Promise<Identity>;
    logout(): Promise<void>;
    getIdToken: IIdTokenProvider;
    setIdTokenProvider(provider: IIdTokenProvider): void;
    setLogoutCallback(callback: ILogoutCallback): void;
}

export interface IAuthenticationRepository {
    login(identityType: string): Promise<Identity>;
}

export interface IAuthenticationGateway {
    execute(identityType: string): Promise<IdentityDTO>;
}

export interface IAuthenticationMapper {
    toIdentity(dto: IdentityDTO): Identity;
}

export const AuthenticationContext =
    createAbstraction<IAuthenticationContext>("AuthenticationContext");

export namespace AuthenticationContext {
    export type Interface = IAuthenticationContext;
    export type IdTokenProvider = IIdTokenProvider;
    export type LogoutCallback = ILogoutCallback;
}

export const AuthenticationRepository = createAbstraction<IAuthenticationRepository>(
    "AuthenticationRepository"
);

export namespace AuthenticationRepository {
    export type Interface = IAuthenticationRepository;
}

export const AuthenticationGateway =
    createAbstraction<IAuthenticationGateway>("AuthenticationGateway");

export namespace AuthenticationGateway {
    export type Interface = IAuthenticationGateway;
}

export const AuthenticationMapper =
    createAbstraction<IAuthenticationMapper>("AuthenticationMapper");

export namespace AuthenticationMapper {
    export type Interface = IAuthenticationMapper;
}

export interface IInternalTokenProvider {
    setTokenProvider(idTokenProvider: IIdTokenProvider): void;
    getTokenProvider(): IIdTokenProvider;
}

export const InternalIdTokenProvider =
    createAbstraction<IInternalTokenProvider>("InternalTokenProvider");
export namespace InternalIdTokenProvider {
    export type Interface = IInternalTokenProvider;
    export type TokenProvider = IIdTokenProvider;
}
