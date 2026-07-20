import type { Container } from "@webiny/di";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
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
    return (container: Container) => {
        container.registerFactory(FolderBeforeCreateEventHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeCreatePayload>) {
                tracker.track("folder:beforeCreate", event.payload);
            }
        }));

        container.registerFactory(FolderAfterCreateEventHandler, () => ({
            async handle(event: DomainEvent<FolderAfterCreatePayload>) {
                tracker.track("folder:afterCreate", event.payload);
            }
        }));

        container.registerFactory(FolderBeforeUpdateEventHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeUpdatePayload>) {
                tracker.track("folder:beforeUpdate", event.payload);
            }
        }));

        container.registerFactory(FolderAfterUpdateEventHandler, () => ({
            async handle(event: DomainEvent<FolderAfterUpdatePayload>) {
                tracker.track("folder:afterUpdate", event.payload);
            }
        }));

        container.registerFactory(FolderBeforeDeleteEventHandler, () => ({
            async handle(event: DomainEvent<FolderBeforeDeletePayload>) {
                tracker.track("folder:beforeDelete", event.payload);
            }
        }));

        container.registerFactory(FolderAfterDeleteEventHandler, () => ({
            async handle(event: DomainEvent<FolderAfterDeletePayload>) {
                tracker.track("folder:afterDelete", event.payload);
            }
        }));
    };
};
