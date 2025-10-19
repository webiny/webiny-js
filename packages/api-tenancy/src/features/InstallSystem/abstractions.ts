import { createAbstraction, Result } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "@webiny/api-core";
import { type AppInstallationData, InstallTenantUseCase } from "../InstallTenant/abstractions.js";
import { InstallSystemError, SystemAlreadyInstalledError } from "./errors.js";
import { CreateTenantUseCase } from "~/features/CreateTenant/abstractions.js";

/**
 * Errors
 */
export interface IInstallSystemErrors {
    base:
        | InstallSystemError
        | SystemAlreadyInstalledError
        | CreateTenantUseCase.Errors
        | InstallTenantUseCase.Errors;
}

/**
 * Types
 */
export type InstallSystemInput = AppInstallationData[];

/**
 * Use Case Abstraction
 */
export interface IInstallSystemUseCase {
    execute(
        input: InstallSystemInput
    ): Promise<Result<void, IInstallSystemErrors[keyof IInstallSystemErrors]>>;
}

export const InstallSystemUseCase =
    createAbstraction<IInstallSystemUseCase>("InstallSystemUseCase");

export namespace InstallSystemUseCase {
    export type Interface = IInstallSystemUseCase;
    export type Input = InstallSystemInput;
}

/**
 * Event Handler Abstraction
 */
export const SystemInstalledHandler =
    createAbstraction<IEventHandler<DomainEvent>>("SystemInstalledHandler");

export namespace SystemInstalledHandler {
    export type Interface = IEventHandler<DomainEvent>;
    export type Event = DomainEvent;
}
