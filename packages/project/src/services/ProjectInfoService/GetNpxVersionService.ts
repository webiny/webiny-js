import { createImplementation } from "@webiny/di";
import { SystemRequirements } from "@webiny/system-requirements";
import { GetNpxVersionService } from "~/abstractions/index.js";

export class DefaultGetNpxVersionService implements GetNpxVersionService.Interface {
    execute() {
        return SystemRequirements.getNpxVersion();
    }
}

export const getNpxVersionService = createImplementation({
    abstraction: GetNpxVersionService,
    implementation: DefaultGetNpxVersionService,
    dependencies: []
});
