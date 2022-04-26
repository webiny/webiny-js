import useGqlHandler from "./useGqlHandler";
import { assignSettingsLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

const name = "Lifecycles test Settings";

describe("Settings Lifecycle Events", () => {
    const handler = useGqlHandler({
        plugins: [assignSettingsLifecycleEvents()]
    });

    const { updateSettings } = handler;

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
                        id: expect.stringMatching(/T#root#L#/),
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("settings:beforeSettingsUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("settings:afterSettingsUpdate")).toEqual(true);
    });
});
