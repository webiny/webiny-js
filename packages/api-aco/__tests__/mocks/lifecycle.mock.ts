import { ContextPlugin } from "@webiny/api";
import type { AcoContext } from "~/types";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import type { DomainEvent } from "@webiny/api-core";
import {
    FolderBeforeCreateHandler,
    FolderAfterCreateHandler,
    type FolderBeforeCreatePayload,
    type FolderAfterCreatePayload
} from "~/features/folders/CreateFolder/abstractions.js";
import {
    FolderBeforeUpdateHandler,
    FolderAfterUpdateHandler,
    type FolderBeforeUpdatePayload,
    type FolderAfterUpdatePayload
} from "~/features/folders/UpdateFolder/abstractions.js";
import {
    FolderBeforeDeleteHandler,
    FolderAfterDeleteHandler,
    type FolderBeforeDeletePayload,
    type FolderAfterDeletePayload
} from "~/features/folders/DeleteFolder/abstractions.js";

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

export const assignFilterLifecycleEvents = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.aco.filter.onFilterBeforeCreate.subscribe(async params => {
            tracker.track("filter:beforeCreate", params);
        });
        context.aco.filter.onFilterAfterCreate.subscribe(async params => {
            tracker.track("filter:afterCreate", params);
        });

        context.aco.filter.onFilterBeforeUpdate.subscribe(async params => {
            tracker.track("filter:beforeUpdate", params);
        });
        context.aco.filter.onFilterAfterUpdate.subscribe(async params => {
            tracker.track("filter:afterUpdate", params);
        });

        context.aco.filter.onFilterBeforeDelete.subscribe(async params => {
            tracker.track("filter:beforeDelete", params);
        });
        context.aco.filter.onFilterAfterDelete.subscribe(async params => {
            tracker.track("filter:afterDelete", params);
        });
    });
};
