import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";
import type { RoleCreatedEvent } from "./RoleCreatedEvent.js";
import type { RoleUpdatedEvent } from "./RoleUpdatedEvent.js";
import type { RoleDeletedEvent } from "./RoleDeletedEvent.js";

/**
 * Reacts to a role created somewhere the admin did not see, such as by the assistant. Roles the admin
 * creates itself are already in its list.
 */
export const RoleCreatedEventHandler = createAbstraction<IEventHandler<RoleCreatedEvent>>(
    "AccessManagement/RoleCreatedEventHandler"
);

export namespace RoleCreatedEventHandler {
    export type Interface = IEventHandler<RoleCreatedEvent>;
    export type Event = RoleCreatedEvent;
}

/** Reacts to a role changed somewhere the admin did not see, such as by the assistant. */
export const RoleUpdatedEventHandler = createAbstraction<IEventHandler<RoleUpdatedEvent>>(
    "AccessManagement/RoleUpdatedEventHandler"
);

export namespace RoleUpdatedEventHandler {
    export type Interface = IEventHandler<RoleUpdatedEvent>;
    export type Event = RoleUpdatedEvent;
}

/** Reacts to a role deleted somewhere the admin did not see, such as by the assistant. */
export const RoleDeletedEventHandler = createAbstraction<IEventHandler<RoleDeletedEvent>>(
    "AccessManagement/RoleDeletedEventHandler"
);

export namespace RoleDeletedEventHandler {
    export type Interface = IEventHandler<RoleDeletedEvent>;
    export type Event = RoleDeletedEvent;
}

export interface IRefreshRoleInCacheRepository {
    execute(id: string): Promise<void>;
}

/** Reads a role back by id and puts it into the roles list, replacing the copy the list has. */
export const RefreshRoleInCacheRepository = createAbstraction<IRefreshRoleInCacheRepository>(
    "AccessManagement/RefreshRoleInCacheRepository"
);

export namespace RefreshRoleInCacheRepository {
    export type Interface = IRefreshRoleInCacheRepository;
}
