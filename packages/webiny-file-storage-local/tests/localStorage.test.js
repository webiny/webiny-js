import path from "path";
import fs from "fs-extra";

import { Storage } from "webiny-file-storage";
import LocalDriver from "webiny-file-storage-local";

describe("LocalStorageDriver class test", () => {
    const publicUrl = "https://cdn.domain.com/";
    const storageRoot = __dirname + "/storage";

    const localDriver = new LocalDriver({
        directory: storageRoot,
        createDatePrefix: true,
        publicUrl
    });

    const localDriver2 = new LocalDriver({
        directory: storageRoot
    });

    const storage = new Storage(localDriver);
    const storage2 = new Storage(localDriver2);

    const file1 = { key: "file.txt", data: { body: "test message" } };
    const file2 = { key: "file2.txt", data: { body: "test message" } };

    beforeAll(() => {
        fs.emptyDirSync(__dirname + "/storage");
    });

    /*afterAll(() => {
        fs.emptyDirSync(__dirname + "/storage");
        fs.removeSync(__dirname + "/storage");
    });*/

    test("should return an empty list of keys", async () => {
        // await expect(storage.getKeys("/", "**/*")).resolves.toEqual([]);
    });

    test("should store a file with date prefix", async () => {
        file1.key = await storage.setFile(file1.key, file1.data);
        expect(file1.key).toBeString();
    });

    test("should store a file without date prefix", async () => {
        file2.key = await storage2.setFile(file2.key, file2.data);
        expect(/^\d{4}\/\d{2}\/\d{2}\//.test(file2.key)).toBeFalse();
    });

    test("should not store an empty file body", async () => {
        await expect(storage.setFile(file1.key, { body: null })).rejects.toThrow();
    });

    test("should return a list of keys containing 1 key", async () => {
        await expect(storage.getKeys()).resolves.toEqual([file2.key]);
    });
    /*
    test("should return a list of keys containing 2 keys", async () => {
        await expect(storage.getKeys("/", "**!/!*")).resolves.toEqual([file1.key, file2.key]);
    });

    test("should return a file as a string", async () => {
        await expect(storage.getFile(file1.key, { encoding: "utf8" })).resolves.toEqual({
            body: file1.data.body
        });
    });

    test("should return a file as a Buffer", async () => {
        const file = await storage.getFile(file1.key);
        expect(file.body instanceof Buffer).toBeTrue();
        expect(file.body.toString()).toBe("test message");
    });

    test("should set file meta", async () => {
        await expect(storage.setMeta(file1.key, {})).resolves.toBeTrue();
    });

    test("should return empty meta", async () => {
        await expect(storage.getMeta(file1.key)).resolves.toBeNil();
    });

    test("should confirm that file exists", async () => {
        await expect(storage.exists(file1.key)).resolves.toBeTrue();
    });

    test("should confirm that file does not exist", async () => {
        await expect(storage.exists("/path/114")).resolves.toBeFalse();
    });

    test("should return time when file was modified", async () => {
        await expect(storage.getTimeModified(file1.key)).resolves.toBeNumber();
    });

    test("should not return time modified", async () => {
        await expect(storage.getTimeModified("/path/does/not/exist")).rejects.toThrow();
    });

    test("should update a file without changing the key", async () => {
        file1.data.body = "file-updated";
        const newKey = await storage.setFile(file1.key, file1.data);
        expect(newKey).toBe(file1.key);
    });

    test("should return file size", async () => {
        await expect(storage.getSize(file1.key)).resolves.toBeNumber();
    });

    test("should not return file size", async () => {
        await expect(storage.getSize("/path/does/not/exist")).rejects.toThrow();
    });

    test("should return file content type", async () => {
        await expect(storage.getContentType(file1.key)).resolves.toBe("text/plain");
    });

    test("should return a public file URL", () => {
        expect(storage.getURL(file1.key)).toBe(publicUrl + file1.key);
    });

    test("should not return a public file URL", () => {
        expect(storage2.getURL(file1.key)).toBe(file1.key);
    });

    test("should return an absolute path to file", async () => {
        await expect(storage.getAbsolutePath(file1.key)).resolves.toBe(
            path.join(storageRoot, file1.key)
        );
    });

    test("should rename a file", async () => {
        const newKey = "/new/key";
        await storage.rename(file1.key, newKey);
        file1.key = newKey;
        await expect(storage.getFile("/new/key", { encoding: "utf8" })).resolves.toEqual(
            file1.data
        );
    });

    test("should delete a file", async () => {
        await storage.delete(file1.key);
        await expect(storage.getFile(file1.key)).rejects.toThrow();
    });*/
});
