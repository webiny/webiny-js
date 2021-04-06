const jestDynalite = require("jest-dynalite");
const path = require("path");

jestDynalite.setup(path.resolve(__dirname, "../../"));

beforeAll(jestDynalite.startDb);

beforeEach(jestDynalite.createTables);
afterEach(jestDynalite.deleteTables);

afterAll(jestDynalite.stopDb);
