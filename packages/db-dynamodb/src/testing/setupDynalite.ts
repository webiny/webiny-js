import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { clearStorageOps } from "@webiny/api-core/testing/environment.js";

declare function __beforeAll(): Promise<void>;
declare function __beforeEach(): Promise<void>;
declare function __afterEach(): Promise<void>;
declare function __afterAll(): Promise<void>;

let setupInitiated = false;

export const setupDynalite = async (packageRoot: string) => {
    if (setupInitiated) {
        return;
    }

    setupInitiated = true;

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
