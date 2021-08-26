import { SecurityIdentity } from "@webiny/api-security";

export const NOT_AUTHORIZED_RESPONSE = operation => ({
    data: {
        pageBuilder: {
            [operation]: {
                data: null,
                error: {
                    code: "SECURITY_NOT_AUTHORIZED",
                    data: null,
                    message: "Not authorized!"
                }
            }
        }
    }
});

export const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

export const identityB = new SecurityIdentity({
    id: "b",
    login: "b",
    type: "test",
    displayName: "Bb"
});

export const menuItemsInput = [
    {
        id: "ksedyow8",
        title: "Products",
        type: "folder",
        children: [
            {
                id: "ksedyugs",
                title: "Primary",
                type: "folder",
                additional: true,
                children: [
                    {
                        id: "ksee1lpt",
                        title: "For Enterprises",
                        type: "link",
                        url: "/enterprise"
                    }
                ]
            },
            {
                id: "ksedzg91",
                title: "Secondary",
                type: "folder",
                primary: false,
                children: [
                    {
                        id: "ksee27tz",
                        title: "Product Roadmap",
                        type: "link",
                        url: "/product-roadmap",
                        srcPrefix: null
                    }
                ]
            }
        ]
    }
];

export const menuItemsOutput = [
    {
        id: "ksedyow8",
        title: "Products",
        type: "folder",
        children: [
            {
                id: "ksedyugs",
                title: "Primary",
                type: "folder",
                children: [
                    {
                        id: "ksee1lpt",
                        title: "For Enterprises",
                        type: "link",
                        url: "/enterprise"
                    }
                ]
            },
            {
                id: "ksedzg91",
                title: "Secondary",
                type: "folder",
                children: [
                    {
                        id: "ksee27tz",
                        title: "Product Roadmap",
                        type: "link",
                        url: "/product-roadmap"
                    }
                ]
            }
        ]
    }
];
