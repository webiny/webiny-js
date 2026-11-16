import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

describe("updateWebinyConfig", () => {
    let projectRoot: string;
    let configPath: string;

    beforeEach(() => {
        const prefix = path.join(os.tmpdir(), "update-webiny-config-");
        projectRoot = fs.mkdtempSync(prefix);
        configPath = path.join(projectRoot, "webiny.config.tsx");
        fs.writeFileSync(configPath, CONFIG);
    });

    afterEach(() => {
        fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    const readConfig = () => {
        return fs.readFileSync(configPath, "utf-8");
    };

    const countImportsOf = (config: string, name: string) => {
        const pattern = new RegExp(`import\\s+{[^}]*\\b${name}\\b[^}]*}`, "g");
        const matches = config.match(pattern) ?? [];
        return matches.length;
    };

    it("does not import a name again that a later import from the same path already has", async () => {
        const imports = [{ specifier: "Api", path: "webiny/extensions" }];
        await updateWebinyConfig({ projectRoot, webinyConfigTsx: { imports } });
        const config = readConfig();

        expect(countImportsOf(config, "Api")).toBe(1);
        expect(config).toContain(`import { Infra } from "webiny/extensions";`);
    });

    it("adds a name that is not imported yet to the first import from that path", async () => {
        const imports = [{ specifier: "Admin", path: "webiny/extensions" }];
        await updateWebinyConfig({ projectRoot, webinyConfigTsx: { imports } });
        const config = readConfig();

        expect(config).toContain(`import { Infra, Admin } from "webiny/extensions";`);
        expect(countImportsOf(config, "Admin")).toBe(1);
    });

    it("treats a name imported under an alias as not imported", async () => {
        const aliased = CONFIG.replace(
            `import { Api } from "webiny/extensions";`,
            `import { Api as WebinyApi } from "webiny/extensions";`
        );
        fs.writeFileSync(configPath, aliased);

        const imports = [{ specifier: "Api", path: "webiny/extensions" }];
        await updateWebinyConfig({ projectRoot, webinyConfigTsx: { imports } });
        const config = readConfig();

        expect(config).toContain(`import { Infra, Api } from "webiny/extensions";`);
    });
});
