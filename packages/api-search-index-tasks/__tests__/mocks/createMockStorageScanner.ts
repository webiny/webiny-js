import type {
    IStorageScanner,
    IStorageScannerRecord,
    IStorageScannerResult
} from "~/abstractions/StorageScanner.js";

export interface IMockScanBatch {
    items: IStorageScannerRecord[];
    cursor?: string;
}

export const createMockStorageScanner = (batches: IMockScanBatch[]) => {
    let callIndex = 0;

    const scanner: IStorageScanner = {
        scan: async (
            _cursor: string | undefined,
            _limit: number
        ): Promise<IStorageScannerResult> => {
            if (callIndex >= batches.length) {
                return { items: [] };
            }
            const batch = batches[callIndex];
            callIndex++;
            return batch;
        }
    };

    return { scanner, getCallCount: () => callIndex };
};
