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
    return __beforeAll();
});

beforeEach(async () => {
    await jestDynalite.createTables();
    return __beforeEach();
});
afterEach(async () => {
    await jestDynalite.deleteTables();
    return __afterEach();
});

afterAll(async () => {
    await jestDynalite.stopDb();
    return __afterAll();
});
