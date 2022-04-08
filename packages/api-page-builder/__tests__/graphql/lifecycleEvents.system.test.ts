import useGqlHandler from "./useGqlHandler";

import { assignSystemLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

describe("System Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignSystemLifecycleEvents()]
    });

    const { install } = handler;

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await install({
            data: {
                name: "Lifecycles test"
            }
        });

        expect(response).toEqual({
            data: {
                pageBuilder: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("system:beforeInstall")).toEqual(true);
        expect(tracker.isExecutedOnce("system:afterInstall")).toEqual(true);
    });
});
