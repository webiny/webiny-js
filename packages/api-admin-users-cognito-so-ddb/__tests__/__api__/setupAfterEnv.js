const jestDynalite = require("jest-dynalite");
const path = require("path");
/**
 * Must be a root of this package.
 */
jestDynalite.setup(path.resolve(__dirname, "../../"));
/**
 * Assign all required dynalite lifecycle methods.
 * And add custom lifecycle methods that are defined in the environment.js global
 */
beforeAll(async () => {
    await jestDynalite.startDb();
});

beforeEach(async () => {
    await jestDynalite.createTables();
});
afterEach(async () => {
    await jestDynalite.deleteTables();
});

afterAll(async () => {
    await jestDynalite.stopDb();
});
