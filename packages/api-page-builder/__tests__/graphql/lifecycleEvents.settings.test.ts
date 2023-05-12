import useGqlHandler from "./useGqlHandler";
import { assignSettingsLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const name = "Lifecycles test Settings";

describe("Settings Lifecycle Events", () => {
    const { updateSettings } = useGqlHandler({
        plugins: [assignSettingsLifecycleEvents()]
    });

    beforeEach(async () => {
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [response] = await updateSettings({
            data: {
                name
            }
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updateSettings: {
                        data: {
                            pages: {
                                home: null,
                                notFound: null
                            },
                            name
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("settings:beforeSettingsUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("settings:afterSettingsUpdate")).toEqual(true);
    });
});
