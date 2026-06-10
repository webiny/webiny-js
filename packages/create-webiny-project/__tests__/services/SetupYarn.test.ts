import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import os from "os";
import { SetupYarn } from "~/services/SetupYarn.js";
import type { CliParams } from "~/types.js";

const createCliParams = (overrides: Partial<CliParams> = {}): CliParams => ({
    projectName: "",
    force: false,
    template: "aws",
    templateOptions: null,
    assignToYarnrc: null,
    tag: "latest",
    interactive: false,
    log: "create-webiny-project-logs.txt",
    debug: false,
    cleanup: true,
    ...overrides
});

const readYarnRc = (projectPath: string): Record<string, any> => {
    const raw = fs.readFileSync(path.join(projectPath, ".yarnrc.yml"), "utf-8");
    return yaml.load(raw) as Record<string, any>;
};

describe("SetupYarn", () => {
    let tmpDir: string;
    let setupYarn: SetupYarn;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webiny-test-"));
        setupYarn = new SetupYarn();
    });

    afterEach(() => {
        fs.removeSync(tmpDir);
    });

    it("should create .yarnrc.yml with all expected settings", async () => {
        const cliParams = createCliParams({ projectName: tmpDir });

        await setupYarn.execute(cliParams);

        const yarnRc = readYarnRc(tmpDir);

        expect(yarnRc.yarnPath).toContain(".yarn/releases/yarn-");
        expect(yarnRc.nodeLinker).toBe("node-modules");
        expect(yarnRc.compressionLevel).toBe("mixed");
        expect(yarnRc.enableScripts).toBe(false);
        expect(yarnRc.npmMinimalAgeGate).toBe("3d");
        expect(yarnRc.approvedGitRepositories).toEqual([
            "https://github.com/webiny/webiny-upgrades-v6"
        ]);
        expect(yarnRc.npmPreapprovedPackages).toEqual(["@webiny/*", "webiny", "wts-client"]);
    });

    it("should copy the yarn binary into .yarn/releases/", async () => {
        const cliParams = createCliParams({ projectName: tmpDir });

        await setupYarn.execute(cliParams);

        const releases = fs.readdirSync(path.join(tmpDir, ".yarn", "releases"));

        expect(releases.length).toBe(1);
        expect(releases[0]).toMatch(/^yarn-.*\.cjs$/);
    });

    it("should allow --assign-to-yarnrc to override template defaults", async () => {
        const overrides = JSON.stringify({ nodeLinker: "pnp", compressionLevel: 0 });
        const cliParams = createCliParams({
            projectName: tmpDir,
            assignToYarnrc: overrides
        });

        await setupYarn.execute(cliParams);

        const yarnRc = readYarnRc(tmpDir);

        expect(yarnRc.nodeLinker).toBe("pnp");
        expect(yarnRc.compressionLevel).toBe(0);
        expect(yarnRc.enableScripts).toBe(false);
    });

    it("should allow --assign-to-yarnrc to add new keys", async () => {
        const overrides = JSON.stringify({ customSetting: "hello" });
        const cliParams = createCliParams({
            projectName: tmpDir,
            assignToYarnrc: overrides
        });

        await setupYarn.execute(cliParams);

        const yarnRc = readYarnRc(tmpDir);

        expect(yarnRc.customSetting).toBe("hello");
        expect(yarnRc.nodeLinker).toBe("node-modules");
    });

    it("should handle invalid --assign-to-yarnrc JSON gracefully", async () => {
        const cliParams = createCliParams({
            projectName: tmpDir,
            assignToYarnrc: "not-valid-json"
        });

        await setupYarn.execute(cliParams);

        const yarnRc = readYarnRc(tmpDir);

        expect(yarnRc.nodeLinker).toBe("node-modules");
        expect(yarnRc.compressionLevel).toBe("mixed");
    });

    it("should preserve existing .yarnrc.yml keys not in the template", async () => {
        fs.writeFileSync(
            path.join(tmpDir, ".yarnrc.yml"),
            yaml.dump({ yarnPath: ".yarn/releases/yarn-4.14.1.cjs", myCustomKey: "keep-me" })
        );

        const cliParams = createCliParams({ projectName: tmpDir });

        await setupYarn.execute(cliParams);

        const yarnRc = readYarnRc(tmpDir);

        expect(yarnRc.myCustomKey).toBe("keep-me");
        expect(yarnRc.nodeLinker).toBe("node-modules");
    });
});
