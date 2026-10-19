import type { AdminAssistantPresenter } from "@webiny/app-admin/features/adminAssistant/index.js";

/** How many times the assistant has finished one of `names`, across the conversation. */
export function countCompletedTools(
    assistant: AdminAssistantPresenter.Interface,
    names: readonly string[]
): number {
    let count = 0;
    for (const turn of assistant.vm.turns) {
        for (const name of turn.completed) {
            if (names.includes(name)) {
                count++;
            }
        }
    }
    return count;
}
