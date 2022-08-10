export const customPermissions = [
    { something: "custom" },
    { name: "custom" },
    { locales: ["en-US"], name: "content.i18n" },
    { name: "pb.*" },
    { name: "pb.category" },
    { name: "fb.form" },
    {
        name: "fm.file",
        own: true,
        rwd: "rwd"
    },
    { name: "fm.settings" },
    { name: "cms.*" },
    { name: "cms.endpoint.read" },
    { name: "cms.endpoint.manage" },
    { name: "cms.endpoint.preview" },
    {
        name: "cms.contentModel",
        own: true,
        pw: "",
        rwd: "rwd"
    },
    {
        groups: {},
        name: "cms.contentModelGroup",
        own: false,
        pw: "",
        rwd: "r"
    },
    {
        name: "cms.contentEntry",
        own: true,
        pw: "p",
        rwd: "rwd"
    },
    { name: "security.*" },
    { name: "security.group" },
    { name: "security.apiKey" },
    { name: "adminUsers.*" },
    { name: "i18n.*" },
    { name: "*" }
];
