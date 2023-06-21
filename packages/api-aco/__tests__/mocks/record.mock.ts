export const recordMocks = {
    recordA: {
        id: "page-a",
        type: "page",
        title: "Page a",
        content: "Sed arcu quam",
        location: {
            folderId: "folder-1"
        },
        data: {
            customCreatedOn: "2023-05-15T00:00:00.000Z",
            customLocked: true,
            customVersion: 12,
            someText: "A text which is searchable",
            identity: {
                id: "user-1",
                displayName: "John Doe",
                type: "user"
            }
        },
        tags: ["page-tag1", "page-tag2", "scope:page"]
    },
    recordB: {
        id: "page-b",
        type: "page",
        title: "Page b",
        content: "Lorem ipsum docet",
        location: {
            folderId: "folder-1"
        },
        data: {
            customCreatedOn: "2023-04-15T00:00:00.000Z",
            customLocked: false,
            customVersion: 5,
            someText: "A text which is searchable as well",
            identity: {
                id: "user-2",
                displayName: "Jane Doe",
                type: "admin"
            }
        },
        tags: ["page-tag1"]
    },
    recordC: {
        id: "page-c",
        type: "page",
        title: "Page c",
        content: "Lorem ipsum docet",
        location: {
            folderId: "folder-2"
        },
        data: {
            customCreatedOn: "2023-03-15T00:00:00.000Z",
            customLocked: false,
            customVersion: 2,
            someText: "A text which is searchable as well",
            identity: {
                id: "user-3",
                displayName: "Janine Doe",
                type: "admin"
            }
        },
        tags: ["page-tag3"]
    },
    recordD: {
        id: "post-d",
        type: "post",
        title: "Post d",
        content: "Sed arcu quam",
        location: {
            folderId: "folder-1"
        },
        data: {
            customLocked: null,
            customCreatedOn: "2023-02-15T00:00:00.000Z",
            customVersion: 1,
            someText: "A text which is searchable as well",
            identity: {
                id: "user-4",
                displayName: "James Doe",
                type: "admin"
            }
        },
        tags: ["post-tag1", "post-tag2", "scope:post"]
    },
    recordE: {
        id: "post-e",
        type: "post",
        title: "Post e",
        location: {
            folderId: "folder-1"
        },
        data: {}
    },
    recordF: {
        id: "post-f",
        type: "post",
        title: "Post f",
        content: "Lorem ipsum docet",
        location: {
            folderId: "folder-1"
        },
        data: {
            any: 1,
            something: "yes",
            num: 1
        }
    },
    recordG: {
        id: "post-g",
        type: "post",
        title: "Post g",
        content: "Lorem ipsum docet",
        location: {
            folderId: "folder-1"
        },
        data: {
            any: 1,
            something: "no",
            num: 3
        }
    },
    recordH: {
        id: "post-h",
        type: "post",
        title: "Post h",
        content: "Lorem ipsum docet",
        location: {
            folderId: "folder-1"
        },
        data: {
            any: 1,
            something: "yes",
            num: 5
        }
    }
};
