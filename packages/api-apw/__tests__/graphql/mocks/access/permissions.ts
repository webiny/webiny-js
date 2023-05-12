export const permissions = [
    {
        name: "content.i18n"
    },
    {
        name: "cms.endpoint.read"
    },
    {
        name: "cms.endpoint.manage"
    },
    {
        name: "cms.endpoint.preview"
    },
    {
        name: "cms.contentModel",
        models: {
            "en-US": ["accessTestModel"]
        },
        rwd: "rwd",
        own: false,
        pw: null
    },
    {
        name: "cms.contentModelGroup",
        rwd: "r",
        own: false,
        pw: null
    },
    {
        name: "cms.contentEntry",
        rwd: "rwd",
        own: false,
        pw: "purc"
    }
];
