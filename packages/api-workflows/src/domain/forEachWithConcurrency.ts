/** Runs on one item; must not throw (a throw rejects the whole run). */
export type ConcurrentItemTask<T> = (item: T) => Promise<void>;

/**
 * Runs `task` on every item, at most `limit` at a time, in no particular order: a fixed number of
 * workers each takes the next item.
 *
 * An accepted exception to "no storage I/O in loops", only for independent writes that have no
 * batch API and stay few. Its two uses:
 * - `ReviewSaver`: the assignment records of a save (the CMS has no create-multiple). Usually one
 *   to three; at most about the step's team size when nearly every candidate is skipped.
 * - `DeleteTargetReviewsUseCase`: `CleanupTaskSubtreeUseCase` per run task of a deleted review
 *   (it takes one task id). One to four per review; run tasks have no subtasks.
 * Anything with a batch API, or that can grow with stored data, must batch instead.
 */
export const forEachWithConcurrency = async <T>(
    items: T[],
    limit: number,
    task: ConcurrentItemTask<T>
): Promise<void> => {
    let next = 0;
    const worker = async (): Promise<void> => {
        while (next < items.length) {
            const item = items[next];
            next++;
            // oxlint-disable-next-line no-await-in-loop -- each worker runs its items one by one; the workers run in parallel.
            await task(item);
        }
    };
    const workerCount = Math.min(limit, items.length);
    const workers: Promise<void>[] = [];
    for (let index = 0; index < workerCount; index++) {
        workers.push(worker());
    }
    await Promise.all(workers);
};
