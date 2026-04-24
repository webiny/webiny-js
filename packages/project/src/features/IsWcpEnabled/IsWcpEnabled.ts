import { createImplementation } from "@webiny/di";
import { GetProjectIdService, IsWcpEnabled } from "~/abstractions/index.js";

export class DefaultIsWcpEnabled implements IsWcpEnabled.Interface {
    constructor(private getProjectIdService: GetProjectIdService.Interface) {}

    async execute() {
        const wcpProjectId = await this.getProjectIdService.execute();
        return Boolean(wcpProjectId);
    }
}

export const isWcpEnabled = createImplementation({
    abstraction: IsWcpEnabled,
    implementation: DefaultIsWcpEnabled,
    dependencies: [GetProjectIdService]
});
