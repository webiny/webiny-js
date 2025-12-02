import { describe, test, expect, beforeEach } from "vitest";
import useGqlHandler from "~tests/utils/useGqlHandler";
import { assignSettingsLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

describe.skip("Files settings lifecycle events", () => {
    const { updateSettings } = useGqlHandler({
        plugins: [assignSettingsLifecycleEvents()]
    });

    const hookParamsExpected = {
        srcPrefix: "https://0c6fb883-webiny-latest-files.s3.amazonaws.com/",
        tenant: "root"
    };

    beforeEach(() => {
        tracker.reset();
    });

    test(`it should call "beforeUpdate" and "afterUpdate" methods`, async () => {
        const settingsData = getSettingsResponse.data.fileManager.getSettings.data;

        const [updateResponse] = await updateSettings({
            data: { uploadMinFileSize: 1024 }
        });
        expect(updateResponse).toEqual({
            data: {
                fileManager: {
                    updateSettings: {
                        data: {
                            ...settingsData,
                            uploadMinFileSize: 1024
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * After that we expect that lifecycle method was triggered.
         */
        expect(tracker.getExecuted("settings:beforeUpdate")).toEqual(1);
        expect(tracker.getExecuted("settings:afterUpdate")).toEqual(1);
        /**
         * Parameters that were received in the lifecycle hooks must be valid as well.
         */
        const beforeUpdate = tracker.getLast("settings:beforeUpdate");
        expect(beforeUpdate && beforeUpdate.params[0]).toEqual({
            input: { uploadMinFileSize: 1024 },
            original: { ...settingsData, ...hookParamsExpected },
            settings: {
                ...settingsData,
                ...hookParamsExpected,
                uploadMinFileSize: 1024
            }
        });
        const afterUpdate = tracker.getLast("settings:afterUpdate");
        expect(afterUpdate && afterUpdate.params[0]).toEqual({
            input: { uploadMinFileSize: 1024 },
            original: { ...settingsData, ...hookParamsExpected },
            settings: {
                ...settingsData,
                ...hookParamsExpected,
                uploadMinFileSize: 1024
            }
        });
    });
});
