const path = require("path");
const fs = require("fs-extra");

describe("Telemetry events test", () => {
    test("should send telemetry events", async () => {
        const events = [
            "project-deploy-start",
            "project-deploy-end",
            "project-deploy-error",
            "project-deploy-error-graceful"
        ];

        const deployScript = await fs.readFile(
            path.resolve(__dirname, "..", "cli", "deploy", "deploy.js")
        );

        for (const event of events) {
            expect(deployScript.includes(event)).toBe(true);
        }
    });
});
