import { createAbstraction, Result } from "@webiny/feature/api";
import type { IEventHandler, DomainEvent } from "~/features/eventPublisher/index.js";
import { InstallSystemError, SystemAlreadyInstalledError } from "./errors.js";
import {
    type AppInstallationData,
    InstallTenantUseCase
} from "~/features/tenancy/InstallTenant/index.js";
import { CreateTenantUseCase } from "~/features/tenancy/CreateTenant/index.js";

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

/** Run system-wide installation. */
export const InstallSystemUseCase =
    createAbstraction<IInstallSystemUseCase>("InstallSystemUseCase");

export namespace InstallSystemUseCase {
    export type Interface = IInstallSystemUseCase;
    export type Input = InstallSystemInput;
}

/** Hook into system lifecycle after the system is installed. */
export const SystemInstalledEventHandler = createAbstraction<IEventHandler<DomainEvent>>(
    "SystemInstalledEventHandler"
);

export namespace SystemInstalledEventHandler {
    export type Interface = IEventHandler<DomainEvent>;
    export type Event = DomainEvent;
}
