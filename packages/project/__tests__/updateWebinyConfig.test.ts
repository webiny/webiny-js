import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { afterEach } from "vitest";
import { updateWebinyConfig } from "~/services/InstallExtensionService/updateWebinyConfig.js";

// The AWS DDB template after the E2E setup added `Api` on its own line.
const CONFIG = `import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";
import { Project } from "webiny/extensions";
import { Api } from "webiny/extensions";

export const Extensions = () => {
    return (
        <>
            <Cognito />
        </>
    );
};
`;

const API_IMPORT = `import { Api } from "webiny/extensions";`;

describe("updateWebinyConfig", () => {
    let projectRoot: string;
    let configPath: string;

    beforeEach(() => {
        const tmpdir = os.tmpdir();
        const prefix = path.join(tmpdir, "update-webiny-config-");
        projectRoot = fs.mkdtempSync(prefix);
        configPath = path.join(projectRoot, "webiny.config.tsx");
        fs.writeFileSync(configPath, CONFIG);
    });

    afterEach(() => {
        fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    const writeConfig = (config: string) => {
        fs.writeFileSync(configPath, config);
    };

    const readConfig = () => {
        return fs.readFileSync(configPath, "utf-8");
    };

    const importName = async (specifier: string) => {
        const imports = [{ specifier, path: "webiny/extensions" }];
        await updateWebinyConfig({ projectRoot, webinyConfigTsx: { imports } });
    };

    const countImportsOf = (config: string, name: string) => {
        const pattern = new RegExp(`^import[^\\n]*{[^}]*\\b${name}\\b[^}]*}`, "gm");
        const matches = config.match(pattern) ?? [];
        return matches.length;
    };

    it("does not import a name again that a later import from the same path already has", async () => {
        await importName("Api");
        const config = readConfig();
        const apiImports = countImportsOf(config, "Api");

        expect(apiImports).toBe(1);
        expect(config).toContain(`import { Infra } from "webiny/extensions";`);
    });

    it("adds a name that is not imported yet to the first import from that path", async () => {
        await importName("Admin");
        const config = readConfig();
        const adminImports = countImportsOf(config, "Admin");

        expect(config).toContain(`import { Infra, Admin } from "webiny/extensions";`);
        expect(adminImports).toBe(1);
    });

    it("adds a name only once when the same import is requested twice", async () => {
        await importName("Admin");
        await importName("Admin");
        const config = readConfig();
        const adminImports = countImportsOf(config, "Admin");

        expect(adminImports).toBe(1);
    });

    it("treats a name imported under an alias as not imported", async () => {
        const aliased = CONFIG.replace(
            API_IMPORT,
            `import { Api as WebinyApi } from "webiny/extensions";`
        );
        writeConfig(aliased);

        await importName("Api");
        const config = readConfig();

        expect(config).toContain(`import { Infra, Api } from "webiny/extensions";`);
    });

    it("does not count a commented-out import", async () => {
        const commented = CONFIG.replace(API_IMPORT, `// ${API_IMPORT}`);
        writeConfig(commented);

        await importName("Api");
        const config = readConfig();

        expect(config).toContain(`import { Infra, Api } from "webiny/extensions";`);
    });

    it("counts a type-only import, so the name is not declared twice", async () => {
        const typeOnly = CONFIG.replace(
            API_IMPORT,
            `import type { Api } from "webiny/extensions";`
        );
        writeConfig(typeOnly);

        await importName("Api");
        const config = readConfig();
        const apiImports = countImportsOf(config, "Api");

        expect(apiImports).toBe(1);
    });

    it("sees a name imported next to a default import", async () => {
        const withDefault = CONFIG.replace(
            API_IMPORT,
            `import Webiny, { Api } from "webiny/extensions";`
        );
        writeConfig(withDefault);

        await importName("Api");
        const config = readConfig();
        const apiImports = countImportsOf(config, "Api");

        expect(apiImports).toBe(1);
    });

    it("adds a new import line when nothing is imported from that path yet", async () => {
        const imports = [{ specifier: "AdminLogo", path: "./extensions/AdminLogo/AdminLogo.js" }];
        await updateWebinyConfig({ projectRoot, webinyConfigTsx: { imports } });
        const config = readConfig();

        expect(config).toContain(
            `${API_IMPORT}\nimport { AdminLogo } from "./extensions/AdminLogo/AdminLogo.js";`
        );
    });
});
