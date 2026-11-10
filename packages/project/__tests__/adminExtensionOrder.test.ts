import fs from "fs";
import os from "os";
import path from "path";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { AdminExtension } from "~/extensions/AdminExtension.js";

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
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "wby-admin-extension-"));
    tempDirs.push(root);

    const adminSrc = path.join(root, "workspace", "apps", "admin", "src");
    fs.mkdirSync(adminSrc, { recursive: true });
    const extensionsTsx = path.join(adminSrc, "Extensions.tsx");
    fs.writeFileSync(extensionsTsx, EXTENSIONS_TSX);

    const folder = (base: string) => ({
        join: (...parts: string[]) => folder(path.join(base, ...parts)),
        toString: () => base
    });

    const project = {
        paths: {
            rootFolder: folder(root),
            workspaceFolder: folder(path.join(root, "workspace")),
            // No tsconfig, so no path aliases: extension paths are absolute.
            tsConfigFile: folder(path.join(root, "tsconfig.json"))
        }
    };

    const createExtension = (name: string) => {
        const file = path.join(root, "extensions", name, "Extension.tsx");
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, `export default () => null;\n`);
        return file;
    };

    return { project, extensionsTsx, createExtension };
}

describe("Admin.Extension", () => {
    it("mounts extensions in the order they're declared, so the last one's decorators are outermost", async () => {
        const { project, extensionsTsx, createExtension } = createProject();
        const first = createExtension("first");
        const second = createExtension("second");
        const third = createExtension("third");
        const build = AdminExtension.def.build!;
        const ctx = { project } as unknown as Parameters<typeof build>[1];

        await build({ src: first }, ctx);
        await build({ src: second }, ctx);
        await build({ src: third }, ctx);

        const source = fs.readFileSync(extensionsTsx, "utf8");
        const importOrder = [...source.matchAll(/import (AdminExtension_\w+) from/g)].map(
            m => m[1]
        );
        const mountOrder = [...source.matchAll(/<(AdminExtension_\w+)\/>/g)].map(m => m[1]);

        expect(importOrder).toHaveLength(3);
        expect(mountOrder).toEqual(importOrder);
        expect(source).toMatch(
            /extensions\/first\/Extension\.js"[\s\S]*extensions\/second[\s\S]*extensions\/third/
        );
    });

    it("adds an extension once, however often it's built", async () => {
        const { project, extensionsTsx, createExtension } = createProject();
        const extension = createExtension("only");
        const build = AdminExtension.def.build!;
        const ctx = { project } as unknown as Parameters<typeof build>[1];

        await build({ src: extension }, ctx);
        await build({ src: extension }, ctx);

        const source = fs.readFileSync(extensionsTsx, "utf8");
        expect([...source.matchAll(/<AdminExtension_\w+\/>/g)]).toHaveLength(1);
    });
});
