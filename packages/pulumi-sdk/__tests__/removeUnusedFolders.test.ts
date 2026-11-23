import fs from "fs";
import os from "os";
import path from "path";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { removeUnusedFolders } from "~/removeUnusedFolders.js";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("removeUnusedFolders", () => {
    let parentFolder: string;

    const createFolder = (name: string, ageDays: number) => {
        const folder = path.join(parentFolder, name);
        fs.mkdirSync(folder);
        const ageMs = ageDays * DAY_MS;
        const time = new Date(Date.now() - ageMs);
        fs.utimesSync(folder, time, time);
    };

    beforeEach(() => {
        const prefix = path.join(os.tmpdir(), "remove-unused-folders-");
        parentFolder = fs.mkdtempSync(prefix);
    });

    afterEach(() => {
        fs.rmSync(parentFolder, { recursive: true, force: true });
    });

    it("removes matching folders unused for more than 30 days, with their lock files", () => {
        createFolder("resource-aws-v7.55.0", 90);
        createFolder("resource-aws-v7.0.0", 40);
        const lockFile = path.join(parentFolder, "resource-aws-v7.0.0.lock");
        fs.writeFileSync(lockFile, "");
        createFolder("resource-aws-v7.1.0", 5);
        createFolder("resource-random-v4.21.6", 40);

        removeUnusedFolders({
            parentFolder,
            keep: "resource-aws-v7.55.0",
            match: name => name.startsWith("resource-aws-")
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
            match: () => true
        });

        const keptFolder = path.join(parentFolder, "resource-aws-v7.55.0");
        const { mtimeMs } = fs.statSync(keptFolder);
        expect(Date.now() - mtimeMs).toBeLessThan(DAY_MS);
    });
});
