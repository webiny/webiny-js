import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { linkSharedPlugins } from "~/linkSharedPlugins.js";

describe("linkSharedPlugins", () => {
    let root: string;
    let pulumiHome: string;
    let store: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), "link-shared-plugins-"));
        pulumiHome = path.join(root, "project", "pulumi");
        store = path.join(root, "store", "plugins");
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it("links a new project's plugins folder to the store", () => {
        linkSharedPlugins(pulumiHome, store);

        const pluginsLink = path.join(pulumiHome, "plugins");
        expect(fs.lstatSync(pluginsLink).isSymbolicLink()).toBe(true);
        expect(fs.realpathSync(pluginsLink)).toBe(fs.realpathSync(store));
    });

    it("moves an existing project's plugins into the store", () => {
        const projectPlugins = path.join(pulumiHome, "plugins");
        fs.mkdirSync(path.join(projectPlugins, "resource-aws-v7.55.0"), { recursive: true });
        fs.writeFileSync(
            path.join(projectPlugins, "resource-aws-v7.55.0", "pulumi-resource-aws"),
            "aws"
        );
        fs.writeFileSync(path.join(projectPlugins, "resource-aws-v7.55.0.lock"), "");
        fs.mkdirSync(path.join(store, "resource-random-v4.21.6"), { recursive: true });
        fs.mkdirSync(path.join(projectPlugins, "resource-random-v4.21.6"), { recursive: true });
        fs.writeFileSync(path.join(projectPlugins, "resource-random-v4.21.6", "project-copy"), "");

        linkSharedPlugins(pulumiHome, store);

        expect(fs.lstatSync(projectPlugins).isSymbolicLink()).toBe(true);
        expect(fs.readdirSync(store).sort()).toEqual([
            "resource-aws-v7.55.0",
            "resource-aws-v7.55.0.lock",
            "resource-random-v4.21.6"
        ]);
        expect(
            fs.readFileSync(path.join(store, "resource-aws-v7.55.0", "pulumi-resource-aws"), "utf8")
        ).toBe("aws");
        // The store already had this plugin, so the project's copy is deleted rather than merged.
        expect(fs.readdirSync(path.join(store, "resource-random-v4.21.6"))).toEqual([]);
    });

    it("repoints a link that leads somewhere other than the store", () => {
        const elsewhere = path.join(root, "elsewhere");
        fs.mkdirSync(elsewhere, { recursive: true });
        fs.mkdirSync(pulumiHome, { recursive: true });
        fs.symlinkSync(elsewhere, path.join(pulumiHome, "plugins"), "junction");

        linkSharedPlugins(pulumiHome, store);

        expect(fs.realpathSync(path.join(pulumiHome, "plugins"))).toBe(fs.realpathSync(store));
    });

    it("leaves a correct link alone", () => {
        linkSharedPlugins(pulumiHome, store);
        const before = fs.lstatSync(path.join(pulumiHome, "plugins")).ino;

        linkSharedPlugins(pulumiHome, store);

        expect(fs.lstatSync(path.join(pulumiHome, "plugins")).ino).toBe(before);
    });
});
