/** Runs on one item; must not throw (a throw rejects the whole run). */
export type ConcurrentItemTask<T> = (item: T) => Promise<void>;

/**
 * Runs `task` on every item, at most `limit` at a time, in no particular order. For independent
 * writes that have no batch API: a fixed number of workers each takes the next item.
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
