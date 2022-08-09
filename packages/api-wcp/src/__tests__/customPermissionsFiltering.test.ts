import { filterOutCustomWbyAppsPermissions } from "~/utils";

describe("Custom permissions filtering test", () => {
    it("should filter out all custom permission objects", async () => {
        expect(
            filterOutCustomWbyAppsPermissions([
                // @ts-ignore Even though this object doesn't contain the `name` property
                // and it's not valid according to TS, we still want to have it in our test.
                { something: "custom" },
                { name: "custom" },
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.*" },
                { name: "pb.category" },
                { name: "fb.form" },
                { name: "fm.file", own: true, rwd: "rwd" },
                { name: "fm.settings" },
                { name: "cms.*" },
                { name: "cms.endpoint.read" },
                { name: "cms.endpoint.manage" },
                { name: "cms.endpoint.preview" },
                { name: "cms.contentModel", own: true, rwd: "rwd", pw: "" },
                { name: "cms.contentModelGroup", own: false, rwd: "r", pw: "", groups: {} },
                { name: "cms.contentEntry", own: true, rwd: "rwd", pw: "p" },
                { name: "security.*" },
                { name: "security.group" },
                { name: "security.apiKey" },
                { name: "adminUsers.*" },
                { name: "i18n.*" },
                { name: "*" }
            ])
        ).toEqual([
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
