import { ActionType } from "@webiny/common-audit-logs";

const YELLOW_ACTIONS: string[] = [ActionType.UPDATE];
const RED_ACTIONS: string[] = [ActionType.DELETE, ActionType.UNPUBLISH, ActionType.MOVE_TO_TRASH];

export function getActionColorClasses(value: string): string {
    if (YELLOW_ACTIONS.includes(value)) {
        return "bg-warning-subtle border-warning-500 text-warning-strong";
    }
    if (RED_ACTIONS.includes(value)) {
        return "bg-destructive-subtle border-destructive-500 text-destructive-strong";
    }
    return "bg-success-subtle border-success-500 text-success-strong";
}
