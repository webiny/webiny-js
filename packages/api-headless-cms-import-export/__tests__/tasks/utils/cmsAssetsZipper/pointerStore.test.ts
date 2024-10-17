import { PointerStore } from "~/tasks/utils/cmsAssetsZipper/PointerStore";

describe("pointer store", () => {
    it("should have defaults on class init", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: undefined
            },
            fileCursor: undefined
        });

        expect(store.getEntryTotalItems()).toBe(0);
        expect(store.getEntryHasMoreItems()).toBe(true);
        expect(store.getEntryCursor()).toBe(undefined);
        expect(store.getFileCursor()).toBe(undefined);
        expect(store.getIsStoredFiles()).toBe(false);
        expect(store.getTaskIsAborted()).toBe(false);
    });

    it("should have passed constructor params set", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: "1234567890"
            },
            fileCursor: "0987654321"
        });
        expect(store.getEntryTotalItems()).toBe(0);
        expect(store.getEntryHasMoreItems()).toBe(true);
        expect(store.getEntryCursor()).toBe("1234567890");
        expect(store.getFileCursor()).toBe("0987654321");
        expect(store.getIsStoredFiles()).toBe(false);
        expect(store.getTaskIsAborted()).toBe(false);
    });

    it("should set entry meta", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: undefined
            }
        });

        store.setEntryMeta({
            cursor: "0987654321",
            hasMoreItems: true,
            totalCount: 100
        });

        expect(store.getEntryTotalItems()).toBe(100);
        expect(store.getEntryHasMoreItems()).toBe(true);
        expect(store.getEntryCursor()).toBe("0987654321");
        expect(store.getFileCursor()).toBe(undefined);
        expect(store.getIsStoredFiles()).toBe(false);
        expect(store.getTaskIsAborted()).toBe(false);
    });

    it("should set and reset file cursor", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: undefined
            }
        });

        store.setFileCursor("0987654321");

        expect(store.getEntryTotalItems()).toBe(0);
        expect(store.getEntryHasMoreItems()).toBe(true);
        expect(store.getEntryCursor()).toBe(undefined);
        expect(store.getFileCursor()).toBe("0987654321");
        expect(store.getIsStoredFiles()).toBe(false);
        expect(store.getTaskIsAborted()).toBe(false);

        store.resetFileCursor();

        expect(store.getEntryTotalItems()).toBe(0);
        expect(store.getEntryHasMoreItems()).toBe(true);
        expect(store.getEntryCursor()).toBe(undefined);
        expect(store.getFileCursor()).toBe(undefined);
        expect(store.getIsStoredFiles()).toBe(false);
        expect(store.getTaskIsAborted()).toBe(false);
    });

    it("should set is stored files", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: undefined
            }
        });

        store.setIsStoredFiles();
        expect(store.getEntryTotalItems()).toBe(0);
        expect(store.getEntryHasMoreItems()).toBe(true);
        expect(store.getEntryCursor()).toBe(undefined);
        expect(store.getFileCursor()).toBe(undefined);
        expect(store.getIsStoredFiles()).toBe(true);
        expect(store.getTaskIsAborted()).toBe(false);
    });

    it("should throw an error on multiple setIsStoredFiles calls", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: undefined
            }
        });
        store.setIsStoredFiles();
        expect(store.getIsStoredFiles()).toBe(true);

        expect(() => {
            store.setIsStoredFiles();
        }).toThrow(`The "setIsStoredFiles" method should be called only once.`);
    });

    it("should set is task aborted", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: undefined
            }
        });

        store.setTaskIsAborted();
        expect(store.getEntryTotalItems()).toBe(0);
        expect(store.getEntryHasMoreItems()).toBe(true);
        expect(store.getEntryCursor()).toBe(undefined);
        expect(store.getFileCursor()).toBe(undefined);
        expect(store.getIsStoredFiles()).toBe(false);
        expect(store.getTaskIsAborted()).toBe(true);
    });

    it("should throw an error on multiple setTaskIsAborted calls", () => {
        const store = new PointerStore({
            entryMeta: {
                cursor: undefined
            }
        });
        store.setTaskIsAborted();
        expect(store.getTaskIsAborted()).toBe(true);

        expect(() => {
            store.setTaskIsAborted();
        }).toThrow(`The "setTaskIsAborted" method should be called only once.`);
    });
});
