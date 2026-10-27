export interface Deferred<T> {
    promise: Promise<T>;
    resolve(value: T): void;
    reject(error: unknown): void;
}

// A promise a test settles by hand, to hold a gateway or use case call open.
export const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    let reject: (error: unknown) => void = () => undefined;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};
