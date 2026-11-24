import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { updateWebinyConfig } from "~/services/InstallExtensionService/updateWebinyConfig.js";

const CONFIG = `import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";
import { Api } from "webiny/extensions";

export const Extensions = () => {
    return (
        <>
            <Cognito />
        </>
    );
};
`;

describe("updateWebinyConfig", () => {
    let configPath: string;

    beforeEach(() => {
        const tmpDir = os.tmpdir();
        const prefix = path.join(tmpDir, "update-webiny-config-");
        const projectRoot = fs.mkdtempSync(prefix);
        configPath = path.join(projectRoot, "webiny.config.tsx");
        fs.writeFileSync(configPath, CONFIG);
    });

    afterEach(() => {
        const projectRoot = path.dirname(configPath);
        fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    const install = async (specifier: string, importPath = "webiny/extensions") => {
        await updateWebinyConfig({
            projectRoot: path.dirname(configPath),
            webinyConfigTsx: { imports: [{ specifier, path: importPath }] }
        });
        return fs.readFileSync(configPath, "utf-8");
    };

    it("leaves the file alone when a later import from the same path has the specifier", async () => {
        const result = await install("Api");

        expect(result).toBe(CONFIG);
    });

    it("leaves the file alone when the first import from the path has the specifier", async () => {
        const result = await install("Infra");

        expect(result).toBe(CONFIG);
    });

    it("adds a missing specifier to the first import from the path", async () => {
        const result = await install("Admin");

        expect(result).toContain(`import { Infra, Admin } from "webiny/extensions";`);
        expect(result).toContain(`import { Api } from "webiny/extensions";`);
    });

    it("adds an import line after the last import when nothing is imported from the path", async () => {
        const result = await install("Auth0", "@webiny/auth0");

        expect(result).toContain(
            `import { Api } from "webiny/extensions";\nimport { Auth0 } from "@webiny/auth0";\n\nexport`
        );
    });

    it("does not count a commented-out import", async () => {
        const commented = CONFIG.replace(
            `import { Api } from "webiny/extensions";`,
            `// import { Admin } from "webiny/extensions";`
        );
        fs.writeFileSync(configPath, commented);

        const result = await install("Admin");

        expect(result).toContain(`import { Infra, Admin } from "webiny/extensions";`);
    });

    it("finds the specifier in an import that also has a default import", async () => {
        const withDefault = CONFIG.replace(
            `import { Api } from "webiny/extensions";`,
            `import Extensions, { Api } from "webiny/extensions";`
        );
        fs.writeFileSync(configPath, withDefault);

        const result = await install("Api");

        expect(result).toBe(withDefault);
    });

    it("turns a type-only import of the name into a value import", async () => {
        const typeOnly = CONFIG.replace(
            `import { Api } from "webiny/extensions";`,
            `import type { Api } from "webiny/extensions";`
        );
        fs.writeFileSync(configPath, typeOnly);

        const result = await install("Api");

        expect(result).toBe(CONFIG);
    });

    it("turns a type-only specifier into a value specifier", async () => {
        const typeOnly = CONFIG.replace(
            `import { Infra } from "webiny/extensions";`,
            `import { Infra, type Admin } from "webiny/extensions";`
        );
        fs.writeFileSync(configPath, typeOnly);

        const result = await install("Admin");

        expect(result).toContain(`import { Infra, Admin } from "webiny/extensions";`);
    });

    it("moves the name out of a type-only import that has other names", async () => {
        const typeOnly = CONFIG.replace(
            `import { Api } from "webiny/extensions";`,
            `import type { Api, Admin } from "webiny/extensions";`
        );
        fs.writeFileSync(configPath, typeOnly);

        const result = await install("Admin");

        expect(result).toContain(`import { Infra, Admin } from "webiny/extensions";`);
        expect(result).toContain(`import type { Api } from "webiny/extensions";`);
    });
});
