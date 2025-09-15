import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { logger } from "../logger.js";
import { clearStorageOps } from "../environment/index.js";
let setupInitiated = false;

export const setupDynalite = async packageRoot => {
    if (setupInitiated) {
        return;
    }

    logger.debug(`Setup Dynalite and global test lifecycle events`);

    setupInitiated = true;

    //eslint-disable-next-line import/dynamic-import-chunkname
    const jestDynalite = await import("jest-dynalite").then(m => m.default ?? m);
    /**
     * Must be a root of this package.
     */
    jestDynalite.setup(packageRoot);
    /**
     * Assign all required dynalite lifecycle methods.
     * And add custom lifecycle methods that are defined in the environment.js global
     */
    beforeAll(async () => {
        logger.debug(`Running global "beforeAll"`);
        await jestDynalite.startDb();
        if (typeof __beforeAll === "function") {
            await __beforeAll();
        }
    });

    beforeEach(async () => {
        logger.debug(`Running global "beforeEach"`);
        await jestDynalite.createTables();
        if (typeof __beforeEach === "function") {
            await __beforeEach();
        }
    });
    afterEach(async () => {
        logger.debug(`Running global "afterEach"`);
        await jestDynalite.deleteTables();
        if (typeof __afterEach === "function") {
            await __afterEach();
        }
    });

    afterAll(async () => {
        logger.debug(`Running global "afterAll"`);
        await jestDynalite.stopDb();
        if (typeof __afterAll === "function") {
            await __afterAll();
        }
        clearStorageOps();
    });
};
