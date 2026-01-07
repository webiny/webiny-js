import { createFeature } from "@webiny/feature/api";
import { NotifyUsersOnStateApproveStep } from "./NotifyUsersOnStateApproveStep.js";
import { NotifyUsersOnStateCancel } from "./NotifyUsersOnStateCancel.js";
import { NotifyUsersOnStateReject } from "./NotifyUsersOnStateReject.js";
import { NotifyUsersOnStateCreate } from "./NotifyUsersOnStateCreate.js";
import { NotifyUsersOnStateDelete } from "./NotifyUsersOnStateDelete.js";
import { NotifyUsersOnStateStartStep } from "./NotifyUsersOnStateStartStep.js";
import { NotifyUsersOnStateTakeOverStep } from "./NotifyUsersOnStateTakeOverStep.js";

export const NotifyUsersFeature = createFeature({
    name: "WorkflowNotifications/NotifyUsers",
    register(container) {
        container.register(NotifyUsersOnStateCreate);
        container.register(NotifyUsersOnStateDelete);
        container.register(NotifyUsersOnStateStartStep);
        container.register(NotifyUsersOnStateTakeOverStep);
        container.register(NotifyUsersOnStateApproveStep);
        container.register(NotifyUsersOnStateReject);
        container.register(NotifyUsersOnStateCancel);
    }
});
