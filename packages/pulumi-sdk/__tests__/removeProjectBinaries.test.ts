import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { removeProjectBinaries } from "~/removeProjectBinaries.js";

describe("removeProjectBinaries", () => {
    let pulumiHome: string;

    beforeEach(() => {
        pulumiHome = fs.mkdtempSync(path.join(os.tmpdir(), "remove-project-binaries-"));
    });

    afterEach(() => {
        fs.rmSync(pulumiHome, { recursive: true, force: true });
    });

    it("removes the CLI executables and keeps the project's Pulumi state", () => {
        for (const file of ["pulumi", "pulumi-language-nodejs", "pulumi.exe", "credentials.json"]) {
            fs.writeFileSync(path.join(pulumiHome, file), "");
        }
        for (const folder of ["plugins", "workspaces", "logs"]) {
            fs.mkdirSync(path.join(pulumiHome, folder));
        }

        removeProjectBinaries(pulumiHome);

        expect(fs.readdirSync(pulumiHome).sort()).toEqual([
            "credentials.json",
            "logs",
            "plugins",
            "workspaces"
        ]);
    });

    it("does nothing when the project has no Pulumi folder yet", () => {
        expect(() => removeProjectBinaries(path.join(pulumiHome, "missing"))).not.toThrow();
    });
});
