import { filterOutCustomWbyAppsPermissions } from "~/createSecurity/filterOutCustomWbyAppsPermissions";
import { customPermissions } from "./mocks/customPermissions";

describe("Custom permissions filtering test", () => {
    it("should filter out all custom permission objects", async () => {
        // Even though this object doesn't contain the `name` property
        // and it's not valid according to TS, we still want to have it in our test.
        // @ts-expect-error
        expect(filterOutCustomWbyAppsPermissions(customPermissions)).toEqual([
            { something: "custom" },
            { name: "custom" },
            { name: "content.i18n", locales: ["en-US"] },
            { name: "pb.*" },
            { name: "cms.*" },
            { name: "security.*" },
            { name: "adminUsers.*" },
            { name: "i18n.*" },
            { name: "*" }
        ]);
    });
});
