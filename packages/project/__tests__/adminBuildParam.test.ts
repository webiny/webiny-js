import fs from "fs";
import os from "os";
import path from "path";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { AdminBuildParam } from "~/extensions/AdminBuildParam.js";

const EXTENSIONS_TSX = `import React from "react";

export const Extensions = () => {
    return <></>;
};
`;

const tempDirs: string[] = [];

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function createProject() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "wby-admin-build-param-"));
    tempDirs.push(root);

    const adminSrc = path.join(root, "workspace", "apps", "admin", "src");
    fs.mkdirSync(adminSrc, { recursive: true });
    fs.writeFileSync(path.join(adminSrc, "Extensions.tsx"), EXTENSIONS_TSX);

    const folder = (base: string) => ({
        join: (...parts: string[]) => folder(path.join(base, ...parts)),
        toString: () => base
    });
    const project = {
        paths: {
            rootFolder: folder(root),
            workspaceFolder: folder(path.join(root, "workspace")),
            tsConfigFile: folder(path.join(root, "tsconfig.json"))
        }
    };
    const buildParamsDir = path.join(adminSrc, "buildParams");
    const paramFile = () => {
        const file = fs.readdirSync(buildParamsDir).find(name => name.startsWith("BuildParam_"));
        return path.join(buildParamsDir, file!);
    };
    return { project, paramFile };
}

describe("Admin.BuildParam", () => {
    it("rewrites the param's file when its value changes, and leaves it alone when it doesn't", async () => {
        const { project, paramFile } = createProject();
        const build = AdminBuildParam.def.build!;
        const ctx = { project } as unknown as Parameters<typeof build>[1];

        await build({ paramName: "MY_FLAG", value: false }, ctx);
        expect(fs.readFileSync(paramFile(), "utf8")).toContain("value = false;");

        // A config edit (the value flipped) reaches the admin.
        await build({ paramName: "MY_FLAG", value: true }, ctx);
        expect(fs.readFileSync(paramFile(), "utf8")).toContain("value = true;");

        // The same value again: the file isn't written, so the watcher doesn't rebuild.
        // Whole seconds: file times are stored at a finer, float-rounded precision.
        const past = new Date(Math.floor(Date.now() / 1000) * 1000 - 60_000);
        fs.utimesSync(paramFile(), past, past);
        await build({ paramName: "MY_FLAG", value: true }, ctx);
        expect(fs.statSync(paramFile()).mtimeMs).toBe(past.getTime());
    });
});
