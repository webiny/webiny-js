import { createImplementation } from "@webiny/di";
import { GetCwdService } from "../../abstractions/index.js";

export class DefaultGetCwdService implements GetCwdService.Interface {
    execute() {
        return process.cwd();
    }
}

export const getCwdService = createImplementation({
    abstraction: GetCwdService,
    implementation: DefaultGetCwdService,
    dependencies: []
});
