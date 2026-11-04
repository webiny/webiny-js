// Lets every pending promise continuation run, including lookups deferred with `Promise.resolve().then(...)`.
export const flushPromises = (): Promise<void> => {
    return new Promise<void>(resolve => setTimeout(resolve, 0));
};
