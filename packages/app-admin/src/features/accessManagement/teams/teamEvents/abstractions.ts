import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";
import type { TeamCreatedEvent } from "./TeamCreatedEvent.js";
import type { TeamUpdatedEvent } from "./TeamUpdatedEvent.js";
import type { TeamDeletedEvent } from "./TeamDeletedEvent.js";

/**
 * Reacts to a team created somewhere the admin did not see, such as by the assistant. Teams the admin
 * creates itself are already in its list.
 */
export const TeamCreatedEventHandler = createAbstraction<IEventHandler<TeamCreatedEvent>>(
    "AccessManagement/TeamCreatedEventHandler"
);

export namespace TeamCreatedEventHandler {
    export type Interface = IEventHandler<TeamCreatedEvent>;
    export type Event = TeamCreatedEvent;
}

/** Reacts to a team changed somewhere the admin did not see, such as by the assistant. */
export const TeamUpdatedEventHandler = createAbstraction<IEventHandler<TeamUpdatedEvent>>(
    "AccessManagement/TeamUpdatedEventHandler"
);

export namespace TeamUpdatedEventHandler {
    export type Interface = IEventHandler<TeamUpdatedEvent>;
    export type Event = TeamUpdatedEvent;
}

/** Reacts to a team deleted somewhere the admin did not see, such as by the assistant. */
export const TeamDeletedEventHandler = createAbstraction<IEventHandler<TeamDeletedEvent>>(
    "AccessManagement/TeamDeletedEventHandler"
);

export namespace TeamDeletedEventHandler {
    export type Interface = IEventHandler<TeamDeletedEvent>;
    export type Event = TeamDeletedEvent;
}

export interface IRefreshTeamInCacheRepository {
    execute(id: string): Promise<void>;
}

/** Reads a team back by id and puts it into the teams list, replacing the copy the list has. */
export const RefreshTeamInCacheRepository = createAbstraction<IRefreshTeamInCacheRepository>(
    "AccessManagement/RefreshTeamInCacheRepository"
);

export namespace RefreshTeamInCacheRepository {
    export type Interface = IRefreshTeamInCacheRepository;
}
