import Storage from "../src/storage";
import MockDriver from "./mockDriver";

describe("Storage class test", () => {
    const cdnUrl = "https://cdn.webiny.com";
    const mockDriver = new MockDriver({ cdnUrl, createDatePrefix: true });

    const storage = new Storage(mockDriver);

    const file1 = {
        key: "/path/1",
        data: { body: "file1", meta: {} }
    };
    const file1Meta = { ext: "jpg", size: 412, timeModified: Date.now(), type: "text/plain" };
    const file2 = {
        key: "/path/2",
        data: { body: "file2", meta: { ext: "png", size: 173, timeModified: Date.now() } }
    };

    test("should return an empty list of keys", async () => {
        await expect(storage.getKeys("/")).resolves.toEqual([]);
    });

    test("should store a file", async () => {
        const newKey = await storage.setFile(file1.key, file1.data);
        expect(newKey).toBeString();
        file1.key = newKey;
    });

    test("should set file meta", async () => {
        await storage.setMeta(file1.key, file1Meta);
        await expect(storage.getMeta(file1.key)).resolves.toEqual(file1Meta);
        file1.data.meta = file1Meta;
    });

    test("should update a file without changing the key", async () => {
        file1.data.body = "file1-updated";
        const newKey = await storage.setFile(file1.key, file1.data);
        await expect(newKey).toEqual(file1.key);
    });

    test("should return a list of file keys", async () => {
        file2.key = await storage.setFile(file2.key, file2.data);
        await expect(storage.getKeys("/")).resolves.toEqual([file1.key, file2.key]);
    });

    test("should return a file", async () => {
        await expect(storage.getFile(file1.key)).resolves.toEqual(file1.data);
    });

    test("should return file meta", async () => {
        await expect(storage.getMeta(file2.key)).resolves.toEqual(file2.data.meta);
    });

    test("should not return file meta", async () => {
        await expect(storage.getMeta("/path/246")).resolves.toBe(null);
    });

    test("should confirm that file exists", async () => {
        await expect(storage.exists(file1.key)).resolves.toBe(true);
    });

    test("should confirm that file does not exist", async () => {
        await expect(storage.exists("/path/114")).resolves.toBe(false);
    });

    test("should return time when file was modified", async () => {
        await expect(storage.getTimeModified(file2.key)).resolves.toBe(
            file2.data.meta.timeModified
        );
    });

    test("should return file size", async () => {
        await expect(storage.getSize(file2.key)).resolves.toBe(file2.data.meta.size);
    });

    test("should return file content type", async () => {
        await expect(storage.getContentType(file1.key)).resolves.toBe(file1.data.meta.type);
    });

    test("should return a public file URL", () => {
        expect(storage.getURL(file1.key)).toBe(cdnUrl + file1.key);
    });

    test("should return an absolute path to file", async () => {
        await expect(storage.getAbsolutePath(file1.key)).resolves.toBe(file1.key);
    });

    test("should rename a file", async () => {
        const newKey = "/new/key";
        await storage.rename(file1.key, newKey);
        file1.key = newKey;
        await expect(storage.getFile("/new/key")).resolves.toEqual(file1.data);
    });

    test("should delete a file", async () => {
        await storage.delete(file1.key);
        await expect(storage.getFile(file1.key)).rejects.toThrow();
    });
});
