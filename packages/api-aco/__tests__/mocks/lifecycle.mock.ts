import { ContextPlugin } from "@webiny/api";
import type { AcoContext } from "~/types";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import type { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import {
    FolderBeforeCreateHandler,
    FolderAfterCreateHandler,
    type FolderBeforeCreatePayload,
    type FolderAfterCreatePayload
} from "~/features/folder/CreateFolder/abstractions.js";
import {
    FolderBeforeUpdateHandler,
    FolderAfterUpdateHandler,
    type FolderBeforeUpdatePayload,
    type FolderAfterUpdatePayload
} from "~/features/folder/UpdateFolder/abstractions.js";
import {
    FolderBeforeDeleteHandler,
    FolderAfterDeleteHandler,
    type FolderBeforeDeletePayload,
    type FolderAfterDeletePayload
} from "~/features/folder/DeleteFolder/abstractions.js";

export const tracker = new LifecycleEventTracker();

export const assignFolderLifecycleEvents = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.container.registerFactory(FolderBeforeCreateHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeCreatePayload>) {
                tracker.track("folder:beforeCreate", event.payload);
            }
        }));

        context.container.registerFactory(FolderAfterCreateHandler, () => ({
            async handle(event: DomainEvent<FolderAfterCreatePayload>) {
                tracker.track("folder:afterCreate", event.payload);
            }
        }));

        context.container.registerFactory(FolderBeforeUpdateHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeUpdatePayload>) {
                tracker.track("folder:beforeUpdate", event.payload);
            }
        }));

        context.container.registerFactory(FolderAfterUpdateHandler, () => ({
            async handle(event: DomainEvent<FolderAfterUpdatePayload>) {
                tracker.track("folder:afterUpdate", event.payload);
            }
        }));

        context.container.registerFactory(FolderBeforeDeleteHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeDeletePayload>) {
                tracker.track("folder:beforeDelete", event.payload);
            }
        }));

        context.container.registerFactory(FolderAfterDeleteHandler, () => ({
            async handle(event: DomainEvent<FolderAfterDeletePayload>) {
                tracker.track("folder:afterDelete", event.payload);
            }
        }));
    });
};
