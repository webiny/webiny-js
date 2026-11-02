import type { NotificationPosition } from "@webiny/app-admin/features/notifications/abstractions.js";

// Every workflows toast: bottom right, 8 seconds, with a close button (R207, QBZ-93).
export const REVIEW_TOAST_POSITION: NotificationPosition = "bottom-right";
export const REVIEW_TOAST_DURATION = 8000;
export const REVIEW_TOAST_LINK_LABEL = "Open Content Reviews";

// The warning after an action that was saved while the content's review state was not (R266).
export const REVIEW_TARGET_SYNC_WARNING_TITLE = "The content was not updated";
export const REVIEW_TARGET_SYNC_WARNING_DESCRIPTION =
    "The review was saved, but the content does not show it yet. Reload the content to see the change.";
