import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        vitestConfig: {
            fileParallelism: true,
            // TEMP: the remote-components source isn't merged yet (only the test landed), so this
            // suite can't import `src/remote-components/RemoteComponentLoader.js`. Re-enable once the
            // source lands. It's the only suite in the package, so allow a no-tests run meanwhile.
            exclude: ["**/RemoteComponentLoader.test.ts"],
            passWithNoTests: true
        }
    });
};
