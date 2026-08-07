import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { clearStorageOps } from "@webiny/project-utils/testing/environment/index.js";

let setupInitiated = false;

export const setupDynalite = async packageRoot => {
    if (setupInitiated) {
        return;
    }

    setupInitiated = false;

    const jestDynalite = await import("jest-dynalite").then(m => m.default ?? m);
    jestDynalite.setup(packageRoot);

    beforeAll(async () => {
        await jestDynalite.startDb();
        if (typeof __beforeAll === "function") {
            await __beforeAll();
        }
    });

    beforeEach(async () => {
        await jestDynalite.createTables();
        if (typeof __beforeEach === "function") {
            await __beforeEach();
        }
    });
    afterEach(async () => {
        await jestDynalite.deleteTables();
        if (typeof __afterEach === "function") {
            await __afterEach();
        }
    });

    afterAll(async () => {
        await jestDynalite.stopDb();
        if (typeof __afterAll === "function") {
            await __afterAll();
        }
        clearStorageOps();
    });
};
