import { ContextPlugin } from "@webiny/api";
import type { AcoContext } from "~/types";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import {
    FolderBeforeCreateEventHandler,
    FolderAfterCreateEventHandler,
    type FolderBeforeCreatePayload,
    type FolderAfterCreatePayload
} from "~/features/folder/CreateFolder/abstractions.js";
import {
    FolderBeforeUpdateEventHandler,
    FolderAfterUpdateEventHandler,
    type FolderBeforeUpdatePayload,
    type FolderAfterUpdatePayload
} from "~/features/folder/UpdateFolder/abstractions.js";
import {
    FolderBeforeDeleteEventHandler,
    FolderAfterDeleteEventHandler,
    type FolderBeforeDeletePayload,
    type FolderAfterDeletePayload
} from "~/features/folder/DeleteFolder/abstractions.js";

export const tracker = new LifecycleEventTracker();

export const assignFolderLifecycleEvents = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.container.registerFactory(FolderBeforeCreateEventHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeCreatePayload>) {
                tracker.track("folder:beforeCreate", event.payload);
            }
        }));

        context.container.registerFactory(FolderAfterCreateEventHandler, () => ({
            async handle(event: DomainEvent<FolderAfterCreatePayload>) {
                tracker.track("folder:afterCreate", event.payload);
            }
        }));

        context.container.registerFactory(FolderBeforeUpdateEventHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeUpdatePayload>) {
                tracker.track("folder:beforeUpdate", event.payload);
            }
        }));

        context.container.registerFactory(FolderAfterUpdateEventHandler, () => ({
            async handle(event: DomainEvent<FolderAfterUpdatePayload>) {
                tracker.track("folder:afterUpdate", event.payload);
            }
        }));

        context.container.registerFactory(FolderBeforeDeleteEventHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeDeletePayload>) {
                tracker.track("folder:beforeDelete", event.payload);
            }
        }));

        context.container.registerFactory(FolderAfterDeleteEventHandler, () => ({
            async handle(event: DomainEvent<FolderAfterDeletePayload>) {
                tracker.track("folder:afterDelete", event.payload);
            }
        }));
    });
};
