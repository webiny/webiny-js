import { Storage, StorageError, File } from "webiny-file-storage";
import MockDriver from "./mockDriver";

describe("File class test", () => {
    const cdnUrl = "https://cdn.webiny.com";
    const mockDriver = new MockDriver({ cdnUrl, createDatePrefix: true });
    const storage = new Storage(mockDriver);

    const file1 = {
        key: "/path/1",
        data: {
            body: "file1",
            meta: { ext: "jpg", size: 412, timeModified: Date.now(), type: "text/plain" }
        }
    };

    test("should store file body and meta", async () => {
        const file = new File(file1.key, storage);
        file.setBody(file1.data.body);
        file.setMeta(file1.data.meta);
        await file.save();

        // Update file key for use in the following tests
        file1.key = file.getKey();
        return Promise.all([
            await expect(storage.exists(file.getKey())).resolves.toBe(true),
            await expect(storage.getFile(file.getKey())).resolves.toEqual(file1.data)
        ]);
    });

    test("should return storage instance", () => {
        const file = new File(file1.key, storage);
        expect(file.getStorage()).toBe(storage);
    });

    test("should return file URL", () => {
        const file = new File(file1.key, storage);
        expect(file.getUrl()).toBe(cdnUrl + file1.key);
    });

    test("should return file body", async () => {
        const file = new File(file1.key, storage);
        await expect(file.getBody()).resolves.toBe(file1.data.body);
    });

    test("should return already loaded file body", async () => {
        const spy = jest.spyOn(storage, "getFile");
        const file = new File(file1.key, storage);
        await file.getBody();
        await expect(file.getBody()).resolves.toBe(file1.data.body);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should return already loaded file meta", async () => {
        const spy = jest.spyOn(storage, "getMeta");
        const file = new File(file1.key, storage);
        await file.getMeta();
        await expect(file.getMeta()).resolves.toBe(file1.data.meta);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should return file meta", async () => {
        const file = new File(file1.key, storage);
        await expect(file.getMeta()).resolves.toBe(file1.data.meta);
    });

    test("should throw a StorageError exception", async () => {
        const file = new File("/missing/key", storage);
        return expect(file.getBody()).rejects.toThrow("File not found");
    });

    test("should return time modified", async () => {
        const file = new File(file1.key, storage);
        await expect(file.getTimeModified()).resolves.toBe(file1.data.meta.timeModified);
    });

    test("should return file size", async () => {
        const file = new File(file1.key, storage);
        await expect(file.getSize()).resolves.toBe(file1.data.meta.size);
    });

    test("should return file content type", async () => {
        const file = new File(file1.key, storage);
        await expect(file.getContentType(file1.key)).resolves.toBe(file1.data.meta.type);
    });

    test("should return absolute file path", async () => {
        const file = new File(file1.key, storage);
        await expect(file.getAbsolutePath()).resolves.toBe(file1.key);
    });

    test("should rename a file", async () => {
        const newKey = "/new/path";
        const file = new File(file1.key, storage);
        await file.rename(newKey);
        file1.key = newKey;
        await expect(storage.getFile(file1.key)).resolves.toEqual(file1.data);
    });

    test("should delete a file", async () => {
        const file = new File(file1.key, storage);
        await file.delete();
        return expect(storage.getFile(file1.key)).rejects.toThrow("File not found");
    });
});
