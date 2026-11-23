import fs from "fs";
import os from "os";
import path from "path";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { linkSharedPlugins } from "~/linkSharedPlugins.js";

describe("linkSharedPlugins", () => {
    let root: string;
    let pulumiHome: string;
    let pluginsLink: string;
    let store: string;

    const writePlugin = (folder: string, name: string, file: string) => {
        const pluginFolder = path.join(folder, name);
        fs.mkdirSync(pluginFolder, { recursive: true });
        const pluginFile = path.join(pluginFolder, file);
        fs.writeFileSync(pluginFile, name);
    };

    beforeEach(() => {
        const prefix = path.join(os.tmpdir(), "link-shared-plugins-");
        root = fs.mkdtempSync(prefix);
        pulumiHome = path.join(root, "project", "pulumi");
        pluginsLink = path.join(pulumiHome, "plugins");
        store = path.join(root, "store", "plugins");
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it("links a new project's plugins folder to the store", () => {
        linkSharedPlugins(pulumiHome, store);

        expect(fs.lstatSync(pluginsLink).isSymbolicLink()).toBe(true);
        expect(fs.realpathSync(pluginsLink)).toBe(fs.realpathSync(store));
    });

    it("leaves a real plugins folder and its contents alone", () => {
        writePlugin(pluginsLink, "resource-aws-v7.55.0", "pulumi-resource-aws");

        linkSharedPlugins(pulumiHome, store);

        expect(fs.lstatSync(pluginsLink).isDirectory()).toBe(true);
        expect(fs.readdirSync(pluginsLink)).toEqual(["resource-aws-v7.55.0"]);
        expect(fs.readdirSync(store)).toEqual([]);
    });

    it("repoints a link that leads somewhere other than the store", () => {
        const elsewhere = path.join(root, "elsewhere");
        fs.mkdirSync(elsewhere, { recursive: true });
        fs.mkdirSync(pulumiHome, { recursive: true });
        fs.symlinkSync(elsewhere, pluginsLink, "junction");

        linkSharedPlugins(pulumiHome, store);

        expect(fs.realpathSync(pluginsLink)).toBe(fs.realpathSync(store));
    });

    it("repoints a link whose target no longer exists", () => {
        const missing = path.join(root, "other-home", ".webiny", "pulumi", "plugins");
        fs.mkdirSync(pulumiHome, { recursive: true });
        fs.symlinkSync(missing, pluginsLink, "junction");

        linkSharedPlugins(pulumiHome, store);

        expect(fs.realpathSync(pluginsLink)).toBe(fs.realpathSync(store));
    });

    it("leaves a correct link alone", () => {
        linkSharedPlugins(pulumiHome, store);
        const before = fs.lstatSync(pluginsLink).ino;

        linkSharedPlugins(pulumiHome, store);

        expect(fs.lstatSync(pluginsLink).ino).toBe(before);
    });
});
