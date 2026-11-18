import path from "path";
import fs from "fs";
import os from "os";
import { X509Certificate } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetApp, UiService } from "@webiny/project/abstractions/index.js";
import { CopyPgModulesAfterApiBuildImpl } from "~/extensions/Postgres/CopyPgModulesAfterApiBuild.js";
import {
    RDS_CA_BUNDLE_SOURCE,
    WEB_FUNCTION_RDS_CA_CERTS
} from "~/extensions/Postgres/rdsCaBundle.js";

// knex and pg are copied by `copyPgRuntimeModules`, which has its own tests.
vi.mock("~/extensions/Postgres/copyPgRuntimeModules.js", () => ({
    copyPgRuntimeModules: async () => ({ packages: [], files: 0 })
}));

/* A path model over a real folder: `join` and `toString`, as the hook uses it. */
const pathModel = (
    folder: string
): { join: (name: string) => unknown; toString: () => string } => ({
    join: (name: string) => pathModel(path.join(folder, name)),
    toString: () => folder
});

const runHook = async (workspaceFolder: string) => {
    const getApp = {
        execute: () => ({ paths: { workspaceFolder: pathModel(workspaceFolder) } })
    } as unknown as GetApp.Interface;
    const ui = { info: () => {} } as unknown as UiService.Interface;
    await new CopyPgModulesAfterApiBuildImpl(getApp, ui).execute();
};

/* The subjects of the certificates in a PEM bundle. */
const subjects = (pem: string) => {
    const certificates = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);
    return (certificates || []).map(certificate => new X509Certificate(certificate).subject);
};

describe("the RDS CA bundle of the web function", () => {
    let workspace: string;

    beforeEach(() => {
        workspace = fs.mkdtempSync(path.join(os.tmpdir(), "rds-ca-"));
    });

    afterEach(() => {
        fs.rmSync(workspace, { recursive: true, force: true });
    });

    it("holds the Amazon RDS root certificates", () => {
        const found = subjects(fs.readFileSync(RDS_CA_BUNDLE_SOURCE, "utf8"));

        // The default certificate authority of a new Aurora cluster, in the region of the test account.
        expect(
            found.some(subject => subject.includes("Amazon RDS eu-central-1 Root CA RSA2048 G1"))
        ).toBe(true);
        expect(found.every(subject => subject.includes("OU=Amazon RDS"))).toBe(true);
    });

    it("is put into build-web, where the web function's NODE_EXTRA_CA_CERTS points, and not into build", async () => {
        const graphql = path.join(workspace, "graphql");
        fs.mkdirSync(path.join(graphql, "build"), { recursive: true });
        fs.mkdirSync(path.join(graphql, "build-web"), { recursive: true });

        await runHook(workspace);

        // Lambda unpacks build-web into /var/task.
        const shipped = path.join(graphql, "build-web", path.basename(WEB_FUNCTION_RDS_CA_CERTS));
        expect(WEB_FUNCTION_RDS_CA_CERTS).toBe("/var/task/rds-ca-bundle.pem");
        expect(fs.readFileSync(shipped, "utf8")).toBe(
            fs.readFileSync(RDS_CA_BUNDLE_SOURCE, "utf8")
        );
        expect(fs.readdirSync(path.join(graphql, "build"))).toEqual([]);
    });

    it("is not written anywhere when the web function is off (no build-web)", async () => {
        const graphql = path.join(workspace, "graphql");
        fs.mkdirSync(path.join(graphql, "build"), { recursive: true });

        await runHook(workspace);

        expect(fs.readdirSync(graphql)).toEqual(["build"]);
        expect(fs.readdirSync(path.join(graphql, "build"))).toEqual([]);
    });
});
