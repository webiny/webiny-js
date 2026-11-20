import { TeamAfterCreateEventHandler } from "~/features/security/teams/CreateTeam/index.js";
import { TeamAfterUpdateEventHandler } from "~/features/security/teams/UpdateTeam/index.js";
import { TeamAfterDeleteEventHandler } from "~/features/security/teams/DeleteTeam/index.js";
import { NotifyRecordChangeUseCase } from "~/features/websockets/index.js";
import { TEAM_RECORD_TYPE } from "./recordType.js";

class NotifyOnTeamCreatedHandlerImpl implements TeamAfterCreateEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: TeamAfterCreateEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: TEAM_RECORD_TYPE,
            id: event.payload.team.id,
            change: "created"
        });
    }
}

export const NotifyOnTeamCreatedHandler = TeamAfterCreateEventHandler.createImplementation({
    implementation: NotifyOnTeamCreatedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});

class NotifyOnTeamUpdatedHandlerImpl implements TeamAfterUpdateEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: TeamAfterUpdateEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: TEAM_RECORD_TYPE,
            id: event.payload.updated.id,
            change: "updated"
        });
    }
}

export const NotifyOnTeamUpdatedHandler = TeamAfterUpdateEventHandler.createImplementation({
    implementation: NotifyOnTeamUpdatedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});

class NotifyOnTeamDeletedHandlerImpl implements TeamAfterDeleteEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: TeamAfterDeleteEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: TEAM_RECORD_TYPE,
            id: event.payload.team.id,
            change: "deleted"
        });
    }
}

export const NotifyOnTeamDeletedHandler = TeamAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnTeamDeletedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
