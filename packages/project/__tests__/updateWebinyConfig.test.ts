import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
    let projectRoot: string;

    beforeEach(() => {
        projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "update-webiny-config-"));
        fs.writeFileSync(path.join(projectRoot, "webiny.config.tsx"), CONFIG);
    });

    afterEach(() => {
        fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    const install = async (specifier: string, importPath = "webiny/extensions") => {
        await updateWebinyConfig({
            projectRoot,
            webinyConfigTsx: { imports: [{ specifier, path: importPath }] }
        });
        return fs.readFileSync(path.join(projectRoot, "webiny.config.tsx"), "utf-8");
    };

    it("leaves the file alone when a later import from the same path has the specifier", async () => {
        expect(await install("Api")).toBe(CONFIG);
    });

    it("leaves the file alone when the first import from the path has the specifier", async () => {
        expect(await install("Infra")).toBe(CONFIG);
    });

    it("adds a missing specifier to the first import from the path", async () => {
        const result = await install("Admin");

        expect(result).toContain(`import { Infra, Admin } from "webiny/extensions";`);
        expect(result).toContain(`import { Api } from "webiny/extensions";`);
    });

    it("adds an import line when nothing is imported from the path", async () => {
        const result = await install("Auth0", "@webiny/auth0");

        expect(result).toContain(
            `import { Api } from "webiny/extensions";\nimport { Auth0 } from "@webiny/auth0";`
        );
    });
});
