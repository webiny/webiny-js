const getMemory = (): NodeJS.MemoryUsage => {
    return process.memoryUsage();
};

export const getCurrentHeapUsedMemory = (): number => {
    const memory = getMemory();

    return memory.heapUsed;
};

export const getCurrentHeapTotalMemory = (): number => {
    const memory = getMemory();

    return memory.heapTotal;
};
