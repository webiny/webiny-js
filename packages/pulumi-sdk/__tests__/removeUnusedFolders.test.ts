import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { removeUnusedFolders } from "~/removeUnusedFolders.js";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("removeUnusedFolders", () => {
    let parentFolder: string;

    const createFolder = (name: string, ageDays: number) => {
        const folder = path.join(parentFolder, name);
        fs.mkdirSync(folder);
        const time = new Date(Date.now() - ageDays * DAY_MS);
        fs.utimesSync(folder, time, time);
    };

    beforeEach(() => {
        parentFolder = fs.mkdtempSync(path.join(os.tmpdir(), "remove-unused-folders-"));
    });

    afterEach(() => {
        fs.rmSync(parentFolder, { recursive: true, force: true });
    });

    it("removes matching folders unused for longer than the max age, with their lock files", () => {
        createFolder("resource-aws-v7.55.0", 90);
        createFolder("resource-aws-v7.0.0", 40);
        fs.writeFileSync(path.join(parentFolder, "resource-aws-v7.0.0.lock"), "");
        createFolder("resource-aws-v7.1.0", 5);
        createFolder("resource-random-v4.21.6", 40);

        removeUnusedFolders({
            parentFolder,
            keep: "resource-aws-v7.55.0",
            match: name => name.startsWith("resource-aws-"),
            maxAgeMs: 30 * DAY_MS
        });

        expect(fs.readdirSync(parentFolder).sort()).toEqual([
            "resource-aws-v7.1.0",
            "resource-aws-v7.55.0",
            "resource-random-v4.21.6"
        ]);
    });

    it("marks the kept folder as used now", () => {
        createFolder("resource-aws-v7.55.0", 90);

        removeUnusedFolders({
            parentFolder,
            keep: "resource-aws-v7.55.0",
            match: () => true,
            maxAgeMs: 30 * DAY_MS
        });

        const mtimeMs = fs.statSync(path.join(parentFolder, "resource-aws-v7.55.0")).mtimeMs;
        expect(Date.now() - mtimeMs).toBeLessThan(DAY_MS);
    });
});
