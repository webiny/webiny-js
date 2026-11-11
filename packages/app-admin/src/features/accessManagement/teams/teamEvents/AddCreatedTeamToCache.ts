import { AddCreatedTeamRepository } from "./abstractions.js";
import { TeamCreatedEventHandler } from "./abstractions.js";

/** Adds the created team to the teams list cache, which the Teams view renders from. */
class AddCreatedTeamToCacheImpl implements TeamCreatedEventHandler.Interface {
    constructor(private repository: AddCreatedTeamRepository.Interface) {}

    async handle(event: TeamCreatedEventHandler.Event): Promise<void> {
        await this.repository.execute(event.payload.id);
    }
}

export const AddCreatedTeamToCache = TeamCreatedEventHandler.createImplementation({
    implementation: AddCreatedTeamToCacheImpl,
    dependencies: [AddCreatedTeamRepository]
});
