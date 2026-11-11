import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";
import type { TeamCreatedEvent } from "./TeamCreatedEvent.js";

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
