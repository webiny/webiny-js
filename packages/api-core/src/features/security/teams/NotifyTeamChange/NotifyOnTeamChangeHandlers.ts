import { TeamAfterCreateEventHandler } from "~/features/security/teams/CreateTeam/index.js";
import { TeamAfterUpdateEventHandler } from "~/features/security/teams/UpdateTeam/index.js";
import { TeamAfterDeleteEventHandler } from "~/features/security/teams/DeleteTeam/index.js";
import { NotifyTeamChangeUseCase } from "./abstractions.js";

class NotifyOnTeamCreatedHandlerImpl implements TeamAfterCreateEventHandler.Interface {
    constructor(private notifyTeamChange: NotifyTeamChangeUseCase.Interface) {}

    async handle(event: TeamAfterCreateEventHandler.Event): Promise<void> {
        await this.notifyTeamChange.execute({ id: event.payload.team.id, change: "created" });
    }
}

export const NotifyOnTeamCreatedHandler = TeamAfterCreateEventHandler.createImplementation({
    implementation: NotifyOnTeamCreatedHandlerImpl,
    dependencies: [NotifyTeamChangeUseCase]
});

class NotifyOnTeamUpdatedHandlerImpl implements TeamAfterUpdateEventHandler.Interface {
    constructor(private notifyTeamChange: NotifyTeamChangeUseCase.Interface) {}

    async handle(event: TeamAfterUpdateEventHandler.Event): Promise<void> {
        await this.notifyTeamChange.execute({ id: event.payload.updated.id, change: "updated" });
    }
}

export const NotifyOnTeamUpdatedHandler = TeamAfterUpdateEventHandler.createImplementation({
    implementation: NotifyOnTeamUpdatedHandlerImpl,
    dependencies: [NotifyTeamChangeUseCase]
});

class NotifyOnTeamDeletedHandlerImpl implements TeamAfterDeleteEventHandler.Interface {
    constructor(private notifyTeamChange: NotifyTeamChangeUseCase.Interface) {}

    async handle(event: TeamAfterDeleteEventHandler.Event): Promise<void> {
        await this.notifyTeamChange.execute({ id: event.payload.team.id, change: "deleted" });
    }
}

export const NotifyOnTeamDeletedHandler = TeamAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnTeamDeletedHandlerImpl,
    dependencies: [NotifyTeamChangeUseCase]
});
