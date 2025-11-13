import { createImplementation } from "@webiny/di";
import { TeamBeforeCreateHandler } from "webiny/api/security/features/CreateTeam.js";

class AfterCreateTeam implements TeamBeforeCreateHandler.Interface {
    async handle() {
        // Your custom logic goes here.
    }
}

export default createImplementation({
    abstraction: TeamBeforeCreateHandler,
    implementation: AfterCreateTeam,
    dependencies: []
});
