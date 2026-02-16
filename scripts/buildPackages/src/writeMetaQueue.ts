let writeQueue = Promise.resolve();

export async function queueMetaWrite(fn: () => Promise<void>): Promise<void> {
    const result = writeQueue.then(fn);
    writeQueue = result.catch(() => {}); // Don't let errors block queue
    return result;
}
