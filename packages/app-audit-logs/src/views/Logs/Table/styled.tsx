import { ActionType } from "@webiny/common-audit-logs";

const YELLOW_ACTIONS: string[] = [ActionType.UPDATE];
const RED_ACTIONS: string[] = [ActionType.DELETE, ActionType.UNPUBLISH, ActionType.MOVE_TO_TRASH];

export function getActionColorClasses(value: string): string {
    if (YELLOW_ACTIONS.includes(value)) {
        return "bg-warning-100 border-warning-500 text-warning-700";
    }
    if (RED_ACTIONS.includes(value)) {
        return "bg-destructive-100 border-destructive-500 text-destructive-700";
    }
    return "bg-success-100 border-success-500 text-success-700";
}
