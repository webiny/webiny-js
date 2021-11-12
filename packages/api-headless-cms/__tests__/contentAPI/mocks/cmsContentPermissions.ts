import { CmsContentModel } from "~/types";

export const mockedGetModel = (modelId: string) => {
    switch (modelId) {
        case iPhoneContentModelId:
            return Promise.resolve({
                createdOn: new Date(),
                savedOn: new Date(),
                locale: "en-US",
                titleFieldId: "title",
                lockedFields: [],
                name: "Category",
                description: "Product category",
                modelId: modelId,
                group: {
                    id: appleContentModelGroupId
                },
                layout: null,
                fields: null
            } as CmsContentModel);

        case macContentModelId:
            return Promise.resolve({
                createdOn: new Date(),
                savedOn: new Date(),
                locale: "en-US",
                titleFieldId: "title",
                lockedFields: [],
                name: "Category",
                description: "Product category",
                modelId: modelId,
                group: {
                    id: ungroupedContentModelGroupId
                },
                layout: null,
                fields: null
            } as CmsContentModel);

        default:
            return Promise.resolve({
                createdOn: new Date(),
                savedOn: new Date(),
                locale: "en-US",
                titleFieldId: "title",
                lockedFields: [],
                name: "Category",
                description: "Product category",
                modelId: modelId,
                group: {
                    id: ungroupedContentModelGroupId
                },
                layout: null,
                fields: null
            } as CmsContentModel);
    }
};

const iPhoneContentModelId = "iPhone";
const macContentModelId = "mac";
const appleTvContentModelId = "tv+";

const appleContentModelGroupId = "607976acdbbbbb0008a9d2cc";
const ungroupedContentModelGroupId = "607976e3746db30008452c8f";

export const permissionsOne = {
    input: [
        {
            name: "cms.contentModel",
            models: { "en-US": [iPhoneContentModelId, macContentModelId] },
            rwd: "r",
            own: false,
            pw: null
        },
        { name: "cms.contentModelGroup", rwd: "r", own: false, pw: null },
        {
            name: "cms.contentEntry",
            groups: { "en-US": [appleContentModelGroupId, ungroupedContentModelGroupId] },
            rwd: "r",
            own: false,
            pw: null
        }
    ],
    output: [
        {
            name: "cms.contentModelGroup",
            rwd: "r",
            own: false,
            pw: null,
            groups: { "en-US": [appleContentModelGroupId, ungroupedContentModelGroupId] }
        },
        {
            name: "cms.contentModel",
            models: { "en-US": [iPhoneContentModelId, macContentModelId] },
            rwd: "r",
            own: false,
            pw: null
        },
        {
            name: "cms.contentEntry",
            rwd: "r",
            own: false,
            pw: null
        }
    ]
};
export const permissionTwo = {
    input: [
        {
            name: "cms.contentModel",
            models: { "en-US": [iPhoneContentModelId, "watch"], "en-UK": [appleTvContentModelId] },
            groups: { "en-US": ["someGroupId"] },
            rwd: "r",
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
            groups: { "en-US": [appleContentModelGroupId, ungroupedContentModelGroupId] },
            models: { "en-US": [iPhoneContentModelId, macContentModelId] },
            rwd: "r",
            own: false,
            pw: null
        }
    ],

    output: [
        {
            name: "cms.contentModelGroup",
            rwd: "r",
            own: false,
            pw: null,
            groups: {
                "en-UK": [ungroupedContentModelGroupId],
                "en-US": ["someGroupId", appleContentModelGroupId, ungroupedContentModelGroupId]
            }
        },
        {
            name: "cms.contentModel",
            models: {
                "en-US": [iPhoneContentModelId, "watch", macContentModelId],
                "en-UK": [appleTvContentModelId]
            },
            rwd: "r",
            own: false,
            pw: null
        },
        {
            name: "cms.contentEntry",
            rwd: "r",
            own: false,
            pw: null
        }
    ]
};
export const permissionThree = {
    input: [
        {
            name: "cms.contentModel",
            models: { "en-US": [iPhoneContentModelId], "en-UK": [appleTvContentModelId] },
            rwd: "r",
            own: false
        },
        {
            name: "cms.contentModelGroup",
            rwd: "r",
            own: false
        },
        {
            name: "cms.contentEntry",
            models: { "en-US": [macContentModelId] },
            rwd: "r",
            own: false,
            pw: null
        }
    ],
    output: [
        {
            name: "cms.contentModelGroup",
            rwd: "r",
            own: false,
            groups: {
                "en-UK": [ungroupedContentModelGroupId],
                "en-US": [appleContentModelGroupId, ungroupedContentModelGroupId]
            }
        },
        {
            name: "cms.contentModel",
            models: {
                "en-US": [iPhoneContentModelId, macContentModelId],
                "en-UK": [appleTvContentModelId]
            },
            rwd: "r",
            own: false
        },
        {
            name: "cms.contentEntry",
            rwd: "r",
            own: false,
            pw: null
        }
    ]
};

export const ownPermissionOne = {
    input: [
        {
            name: "cms.contentModel",
            rwd: "rwd",
            own: true,
            pw: null
        },
        {
            name: "cms.contentEntry",
            groups: { "en-US": [appleContentModelGroupId, ungroupedContentModelGroupId] },
            models: { "en-US": [iPhoneContentModelId, macContentModelId] },
            rwd: "r",
            own: false,
            pw: null
        }
    ],
    output: [
        {
            name: "cms.contentModelGroup",
            rwd: "r",
            own: false
        },
        {
            name: "cms.contentModel",
            rwd: "rwd",
            own: true,
            pw: null
        },
        {
            name: "cms.contentEntry",
            rwd: "rwd",
            own: true,
            pw: null
        }
    ]
};
export const ownPermissionTwo = {
    input: [
        {
            name: "cms.contentModelGroup",
            rwd: "r",
            own: true
        },
        {
            name: "cms.contentModel",
            rwd: "rwd",
            own: true,
            pw: null
        },
        {
            name: "cms.contentEntry",
            groups: { "en-US": [appleContentModelGroupId, ungroupedContentModelGroupId] },
            models: { "en-US": [iPhoneContentModelId, macContentModelId] },
            rwd: "r",
            own: false,
            pw: null
        }
    ],
    output: [
        {
            name: "cms.contentModelGroup",
            rwd: "rwd",
            own: true
        },
        {
            name: "cms.contentModel",
            rwd: "rwd",
            own: true,
            pw: null
        },
        {
            name: "cms.contentEntry",
            rwd: "rwd",
            own: true,
            pw: null
        }
    ]
};
export const ownPermissionThree = {
    input: [
        {
            name: "cms.contentEntry",
            groups: { "en-US": [appleContentModelGroupId, ungroupedContentModelGroupId] },
            models: { "en-US": [iPhoneContentModelId, macContentModelId] },
            rwd: "r",
            own: true,
            pw: null
        }
    ],
    output: [
        {
            name: "cms.contentModelGroup",
            rwd: "r",
            own: false
        },
        {
            name: "cms.contentModel",
            rwd: "r",
            own: false
        },
        {
            name: "cms.contentEntry",
            rwd: "rwd",
            own: true,
            pw: null
        }
    ]
};
