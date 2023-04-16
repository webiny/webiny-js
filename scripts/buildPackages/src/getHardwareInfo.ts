import os from "os";

export const getHardwareInfo = () => {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
        cpuCount: cpus.length,
        cpuName: cpus[0].model,
        totalMemory,
        freeMemory
    };
};
