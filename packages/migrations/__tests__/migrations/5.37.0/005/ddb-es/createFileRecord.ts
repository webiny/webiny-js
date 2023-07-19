export const createFileRecord = (index: number) => {
    return {
        _md: "2023-06-27T14:06:16.328Z",
        data: {
            aliases: [],
            type: "image/jpeg",
            locale: "en-US",
            createdOn: "2023-06-27T14:06:16.328Z",
            tags: [],
            size: 286270,
            createdBy: {
                type: "admin",
                displayName: "Pavel Denisjuk",
                id: "649aeb9dfa4a560008fa2ec6"
            },
            webinyVersion: "5.36.2",
            meta: {
                private: false
            },
            name: "image-41.jpg",
            id: `649aecd7fa4a560008fa2f1c${index}`,
            key: `649aecd7fa4a560008fa2f1c${index}/image-${index}.jpg`,
            tenant: "root"
        },
        GSI1_SK: `649aecd7fa4a560008fa2f1c${index}`,
        SK: "A",
        PK: `T#root#L#en-US#FM#F649aecd7fa4a560008fa2f1c${index}`,
        _et: "FM.File",
        _ct: "2023-06-27T14:06:16.328Z",
        TYPE: "fm.file",
        GSI1_PK: "T#root#L#en-US#FM#FILES"
    };
};

export const createLatestSearchRecord = (index: number) => {
    return {
        modelId: "acoSearchRecord",
        version: 1,
        savedOn: "2023-06-27T14:06:40.491Z",
        locale: "en-US",
        status: "draft",
        values: {
            "object@location": {
                "text@folderId": "ROOT"
            },
            "text@title": `image-${index}.jpg`,
            "text@type": "FmFile",
            "wby-aco-json@data": {
                aliases: [],
                size: 137015,
                createdBy: {
                    type: "admin",
                    displayName: "Pavel Denisjuk",
                    id: "649aeb9dfa4a560008fa2ec6"
                },
                meta: {
                    private: false
                },
                name: "image-49.jpg",
                id: `649aecd7fa4a560008fa2f1c${index}`,
                key: `649aecd7fa4a560008fa2f1c${index}/image-${index}.jpg`,
                type: "image/jpeg",
                createdOn: "2023-06-27T14:06:40.463Z"
            },
            "text@tags": ["mime:image/jpeg"]
        },
        _et: "CmsEntries",
        createdBy: {
            type: "admin",
            displayName: "Pavel Denisjuk",
            id: "649aeb9dfa4a560008fa2ec6"
        },
        _ct: "2023-06-27T14:06:40.504Z",
        TYPE: "cms.entry.l",
        entryId: `wby-aco-649aecd7fa4a560008fa2f1c${index}`,
        tenant: "root",
        _md: "2023-06-27T14:06:40.504Z",
        createdOn: "2023-06-27T14:06:40.491Z",
        locked: false,
        ownedBy: {
            type: "admin",
            displayName: "Pavel Denisjuk",
            id: "649aeb9dfa4a560008fa2ec6"
        },
        SK: "L",
        webinyVersion: "5.36.2",
        id: `wby-aco-649aecd7fa4a560008fa2f1c${index}#0001`,
        PK: `T#root#L#en-US#CMS#CME#wby-aco-649aecd7fa4a560008fa2f1c${index}`
    };
};

export const createSearchRecordRevision = (index: number) => {
    return {
        ...createLatestSearchRecord(index),
        TYPE: "cms.entry",
        SK: "REV#0001"
    };
};
