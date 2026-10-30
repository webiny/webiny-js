/** Shared, ordered log of collaborator calls (`sync`, `event:<type>`). Reset per test. */
export const callLog: string[] = [];

export const resetCallLog = (): void => {
    callLog.length = 0;
};
