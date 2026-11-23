import fs from "fs";
import os from "os";
import path from "path";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { removeProjectBinaries } from "~/removeProjectBinaries.js";

describe("removeProjectBinaries", () => {
    let pulumiHome: string;

    const createFiles = (files: string[]) => {
        for (const file of files) {
            const filePath = path.join(pulumiHome, file);
            fs.writeFileSync(filePath, "");
        }
    };

    const createFolders = (folders: string[]) => {
        for (const folder of folders) {
            const folderPath = path.join(pulumiHome, folder);
            fs.mkdirSync(folderPath);
        }
    };

    beforeEach(() => {
        const prefix = path.join(os.tmpdir(), "remove-project-binaries-");
        pulumiHome = fs.mkdtempSync(prefix);
    });

    afterEach(() => {
        fs.rmSync(pulumiHome, { recursive: true, force: true });
    });

    it("removes the CLI executables and keeps the project's Pulumi state", () => {
        createFiles(["pulumi", "pulumi-language-nodejs", "credentials.json"]);
        createFolders(["plugins", "workspaces", "logs"]);

        removeProjectBinaries(pulumiHome);

        expect(fs.readdirSync(pulumiHome).sort()).toEqual([
            "credentials.json",
            "logs",
            "plugins",
            "workspaces"
        ]);
    });

    it("recognises the Windows executable", () => {
        createFiles(["pulumi.exe", "pulumi-language-nodejs.exe", "credentials.json"]);

        removeProjectBinaries(pulumiHome);

        expect(fs.readdirSync(pulumiHome)).toEqual(["credentials.json"]);
    });

    it("leaves files alone once the pulumi executable is gone", () => {
        createFiles(["pulumi-settings.json", "credentials.json"]);

        removeProjectBinaries(pulumiHome);

        expect(fs.readdirSync(pulumiHome).sort()).toEqual([
            "credentials.json",
            "pulumi-settings.json"
        ]);
    });

    it("does nothing when the project has no Pulumi folder yet", () => {
        const missing = path.join(pulumiHome, "missing");
        expect(() => removeProjectBinaries(missing)).not.toThrow();
    });
});
