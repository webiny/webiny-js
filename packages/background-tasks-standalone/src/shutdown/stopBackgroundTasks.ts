import type { Container } from "@webiny/di";
import { BackgroundTasksLoop } from "~/domain/BackgroundTasksLoop.js";

/**
 * Hands this process's tasks back before it exits. Running iterations save their progress and
 * release their claims, so another process picks them up at its next recovery sweep instead of
 * once the claims run out. Resolves when they have, or after `timeoutMs`.
 */
export function stopBackgroundTasks(rootContainer: Container, timeoutMs: number): Promise<void> {
    const loop = rootContainer.resolve(BackgroundTasksLoop);
    return loop.stop(timeoutMs);
}
