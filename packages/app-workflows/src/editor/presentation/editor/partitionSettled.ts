export interface SettledValues<T> {
    values: T[];
    // At least one request was rejected.
    failed: boolean;
}

// The fulfilled values of `Promise.allSettled` and whether any request failed.
export const partitionSettled = <T>(results: PromiseSettledResult<T>[]): SettledValues<T> => {
    const values: T[] = [];
    let failed = false;
    for (const result of results) {
        if (result.status === "fulfilled") {
            values.push(result.value);
        } else {
            failed = true;
        }
    }
    return { values, failed };
};
