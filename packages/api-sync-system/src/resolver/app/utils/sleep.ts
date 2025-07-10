export const sleep = (ms: number) => {
    return new Promise<void>(resolve => {
        setTimeout(resolve, ms);
    });
};
