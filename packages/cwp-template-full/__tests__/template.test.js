const scaffoldFunction = require("..");
const path = require('path');

describe("Settings Test", () => {
    test(`should be able to scaffold all project files correctly`, async () => {
        const appName = "test-project";
        const root = path.join(__dirname, "test-project");

        await scaffoldFunction({ appName, root });
    });
});
