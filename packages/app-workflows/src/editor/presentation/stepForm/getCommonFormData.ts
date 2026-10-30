import type { EditorStep } from "~/editor/domain/types.js";
import type { CommonFormValues } from "./StepFormData.js";

// The common fields of a step as form values; the notification ids keep every stored id, listed or not (D151).
export const getCommonFormData = (step: EditorStep): CommonFormValues => {
    return {
        title: step.title,
        color: step.color,
        description: step.description ?? "",
        notifications: [...step.notificationIds]
    };
};
