import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { IWorkflowStepTeam } from "~/domain/workflow/abstractions.js";

export interface IGetUserTeamsUseCase {
    execute(userId: string): Promise<Result<IWorkflowStepTeam[], never>>;
}

export const GetUserTeamsUseCase = createAbstraction<IGetUserTeamsUseCase>("GetUserTeamsUseCase");

export namespace GetUserTeamsUseCase {
    export type Interface = IGetUserTeamsUseCase;
    export type Return = ReturnType<Interface["execute"]>;
}
