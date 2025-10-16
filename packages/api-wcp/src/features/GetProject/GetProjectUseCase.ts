import { Result } from "@webiny/feature/api";
import type { WcpProject } from "~/types.js";
import type { GetProjectUseCase as UseCase } from "./abstractions.js";

export class GetProjectUseCase implements UseCase.Interface {
    constructor(private readonly getProject: () => WcpProject | null) {}

    async execute(): UseCase.Result {
        return Result.ok(this.getProject());
    }
}
