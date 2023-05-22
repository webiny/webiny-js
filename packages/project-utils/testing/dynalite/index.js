let setupInitiated = false;

module.exports.setupDynalite = packageRoot => {
    if (setupInitiated) {
        return;
    }

    setupInitiated = true;

    const jestDynalite = require("jest-dynalite");
    /**
     * Must be a root of this package.
     */
    jestDynalite.setup(packageRoot);
    /**
     * Assign all required dynalite lifecycle methods.
     * And add custom lifecycle methods that are defined in the environment.js global
     */
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
    });
};
