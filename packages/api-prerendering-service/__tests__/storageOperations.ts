import { PrerenderingServiceStorageOperations } from "~/types";

export const getStorageOperations = (): PrerenderingServiceStorageOperations => {
    // @ts-ignore
    if (typeof __getStorageOperations !== "function") {
        throw new Error(`There is no global "__getStorageOperations" function.`);
    }
    // @ts-ignore
    const { createStorageOperations } = __getStorageOperations();
    if (typeof createStorageOperations !== "function") {
        throw new Error(
            `A product of "createStorageOperations" must be a function to initialize storage operations.`
        );
    }
    return createStorageOperations();
};
