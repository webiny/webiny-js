import bytes from "bytes";
import { getCurrentHeapUsedMemory } from "./memory";
import { log } from "./log";

export const iterate = async (max: number, cb: (current: number) => Promise<void>) => {
    const memoryStart = getCurrentHeapUsedMemory();
    const timeStart = new Date();
    for (let current = 0; current < max; current++) {
        const memoryIterationStart = getCurrentHeapUsedMemory();
        await cb(current);
        const memoryIterationEnd = getCurrentHeapUsedMemory();

        const memoryIterationUsed = bytes.format(memoryIterationEnd - memoryIterationStart, {
            unit: "kb"
        });
        log(`Memory used in iteration ${current}: ${memoryIterationUsed}`, "noting");
    }
    const memoryEnd = getCurrentHeapUsedMemory();
    const timeEnd = new Date();
    // elapsed should be represented in seconds
    const elapsed = `${((timeEnd.getTime() - timeStart.getTime()) / 1000).toFixed(2)}s`;

    // const memoryUsed = bytes.format(memoryEnd - memoryStart);
    log({
        amount: max,
        memoryStart: bytes.format(memoryStart, {
            unit: "mb"
        }),
        memoryEnd: bytes.format(memoryEnd, {
            unit: "mb"
        }),
        memoryUsed: bytes.format(memoryEnd - memoryStart, {
            unit: "mb"
        }),
        elapsed
    });
};
