import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import {
    ApiKeyBeforeCreateEventHandler,
    ApiKeyAfterCreateEventHandler
} from "~/features/security/apiKeys/CreateApiKey/events.js";
import {
    ApiKeyBeforeUpdateEventHandler,
    ApiKeyAfterUpdateEventHandler
} from "~/features/security/apiKeys/UpdateApiKey/events.js";
import {
    ApiKeyBeforeDeleteEventHandler,
    ApiKeyAfterDeleteEventHandler
} from "~/features/security/apiKeys/DeleteApiKey/events.js";
import {
    RoleBeforeCreateEventHandler,
    RoleAfterCreateEventHandler
} from "~/features/security/roles/CreateRole/events.js";
import {
    RoleBeforeUpdateEventHandler,
    RoleAfterUpdateEventHandler
} from "~/features/security/roles/UpdateRole/events.js";
import {
    RoleBeforeDeleteEventHandler,
    RoleAfterDeleteEventHandler
} from "~/features/security/roles/DeleteRole/events.js";

export const tracker = new LifecycleEventTracker();

class ApiKeyBeforeCreateTrackerHandler implements ApiKeyBeforeCreateEventHandler.Interface {
    async handle(event: ApiKeyBeforeCreateEventHandler.Event) {
        tracker.track("apiKey:beforeCreate", event);
    }
}
class ApiKeyAfterCreateTrackerHandler implements ApiKeyAfterCreateEventHandler.Interface {
    async handle(event: ApiKeyAfterCreateEventHandler.Event) {
        tracker.track("apiKey:afterCreate", event);
    }
}
class ApiKeyBeforeUpdateTrackerHandler implements ApiKeyBeforeUpdateEventHandler.Interface {
    async handle(event: ApiKeyBeforeUpdateEventHandler.Event) {
        tracker.track("apiKey:beforeUpdate", event);
    }
}
class ApiKeyAfterUpdateTrackerHandler implements ApiKeyAfterUpdateEventHandler.Interface {
    async handle(event: ApiKeyAfterUpdateEventHandler.Event) {
        tracker.track("apiKey:afterUpdate", event);
    }
}
class ApiKeyBeforeDeleteTrackerHandler implements ApiKeyBeforeDeleteEventHandler.Interface {
    async handle(event: ApiKeyBeforeDeleteEventHandler.Event) {
        tracker.track("apiKey:beforeDelete", event);
    }
}
class ApiKeyAfterDeleteTrackerHandler implements ApiKeyAfterDeleteEventHandler.Interface {
    async handle(event: ApiKeyAfterDeleteEventHandler.Event) {
        tracker.track("apiKey:afterDelete", event);
    }
}
class RoleBeforeCreateTrackerHandler implements RoleBeforeCreateEventHandler.Interface {
    async handle(event: RoleBeforeCreateEventHandler.Event) {
        tracker.track("role:beforeCreate", event);
    }
}
class RoleAfterCreateTrackerHandler implements RoleAfterCreateEventHandler.Interface {
    async handle(event: RoleAfterCreateEventHandler.Event) {
        tracker.track("role:afterCreate", event);
    }
}
class RoleBeforeUpdateTrackerHandler implements RoleBeforeUpdateEventHandler.Interface {
    async handle(event: RoleBeforeUpdateEventHandler.Event) {
        tracker.track("role:beforeUpdate", event);
    }
}
class RoleAfterUpdateTrackerHandler implements RoleAfterUpdateEventHandler.Interface {
    async handle(event: RoleAfterUpdateEventHandler.Event) {
        tracker.track("role:afterUpdate", event);
    }
}
class RoleBeforeDeleteTrackerHandler implements RoleBeforeDeleteEventHandler.Interface {
    async handle(event: RoleBeforeDeleteEventHandler.Event) {
        tracker.track("role:beforeDelete", event);
    }
}
class RoleAfterDeleteTrackerHandler implements RoleAfterDeleteEventHandler.Interface {
    async handle(event: RoleAfterDeleteEventHandler.Event) {
        tracker.track("role:afterDelete", event);
    }
}

export const assignApiKeyLifecycleEvents = () => [
    ApiKeyBeforeCreateEventHandler.createImplementation({
        implementation: ApiKeyBeforeCreateTrackerHandler,
        dependencies: []
    }),
    ApiKeyAfterCreateEventHandler.createImplementation({
        implementation: ApiKeyAfterCreateTrackerHandler,
        dependencies: []
    }),
    ApiKeyBeforeUpdateEventHandler.createImplementation({
        implementation: ApiKeyBeforeUpdateTrackerHandler,
        dependencies: []
    }),
    ApiKeyAfterUpdateEventHandler.createImplementation({
        implementation: ApiKeyAfterUpdateTrackerHandler,
        dependencies: []
    }),
    ApiKeyBeforeDeleteEventHandler.createImplementation({
        implementation: ApiKeyBeforeDeleteTrackerHandler,
        dependencies: []
    }),
    ApiKeyAfterDeleteEventHandler.createImplementation({
        implementation: ApiKeyAfterDeleteTrackerHandler,
        dependencies: []
    })
];

export const assignRoleLifecycleEvents = () => [
    RoleBeforeCreateEventHandler.createImplementation({
        implementation: RoleBeforeCreateTrackerHandler,
        dependencies: []
    }),
    RoleAfterCreateEventHandler.createImplementation({
        implementation: RoleAfterCreateTrackerHandler,
        dependencies: []
    }),
    RoleBeforeUpdateEventHandler.createImplementation({
        implementation: RoleBeforeUpdateTrackerHandler,
        dependencies: []
    }),
    RoleAfterUpdateEventHandler.createImplementation({
        implementation: RoleAfterUpdateTrackerHandler,
        dependencies: []
    }),
    RoleBeforeDeleteEventHandler.createImplementation({
        implementation: RoleBeforeDeleteTrackerHandler,
        dependencies: []
    }),
    RoleAfterDeleteEventHandler.createImplementation({
        implementation: RoleAfterDeleteTrackerHandler,
        dependencies: []
    })
];
