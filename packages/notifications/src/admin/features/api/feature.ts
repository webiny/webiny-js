import { createFeature } from "@webiny/feature/admin";
import { NotificationsApi as ApiAbstraction } from "./abstractions.js";
import { NotificationsGateway } from "./NotificationsGateway.js";
import { NotificationsApi } from "./NotificationsApi.js";

export const NotificationsApiFeature = createFeature({
    name: "Notifications/Api",
    register(container) {
        container.register(NotificationsGateway).inSingletonScope();
        container.register(NotificationsApi).inSingletonScope();
    },
    resolve(container) {
        return {
            api: container.resolve(ApiAbstraction)
        };
    }
});
