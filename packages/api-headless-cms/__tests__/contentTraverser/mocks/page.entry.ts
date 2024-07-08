export const pageEntry = {
    modelId: "page",
    revisionCreatedOn: "2024-06-27T12:45:56.795Z",
    status: "draft",
    meta: {},
    revisionCreatedBy: {
        type: "admin",
        displayName: "John Doe",
        id: "667d2515df36ec000a8c8072"
    },
    revisionModifiedBy: {
        type: "admin",
        displayName: "John Doe",
        id: "667d2515df36ec000a8c8072"
    },
    createdBy: {
        type: "admin",
        displayName: "John Doe",
        id: "667d2515df36ec000a8c8072"
    },
    entryId: "667d5f049718b800089a41f8",
    id: "667d5f049718b800089a41f8#0001",
    savedBy: {
        type: "admin",
        displayName: "John Doe",
        id: "667d2515df36ec000a8c8072"
    },
    version: 1,
    location: {
        folderId: "667d2ca4fcae6a000ac38af5#0001"
    },
    revisionSavedOn: "2024-07-05T09:18:51.860Z",
    locale: "en-US",
    savedOn: "2024-07-05T09:18:51.860Z",
    values: {
        pageTitle: "From the Playground",
        pageType: "BasicPageTemplate",
        pageSettings: {
            generalPageSettings: {
                pageSlug: "from-the-playground",
                deliveryDomain: "acme.com",
                layout: "dark",
                pageClass: null,
                pageCategory: null,
                redirectUrl: null,
                browserTabTitle: "John was here",
                description: "the description",
                customCanonicalUrl: null,
                contentOwner: "ulf@acme.com",
                organisation: "acme",
                navTitle: null,
                hideInNavigation: false,
                hideInBreadcrumb: false,
                noFollow: "inherited",
                noIndex: "inherited",
                publishTime: null,
                unPublishTime: null,
                headerContactLink: null,
                copyRightText: null,
                inheritFooterLinks: null,
                footerLinkList: [],
                inheritSocialMediaLinks: null,
                socialMediaLinkList: [],
                uuid: "acme:Ma3wHp4Vb1n"
            },
            pageTeaserSettings: {
                pageTeaserMedia: {
                    file: null,
                    altText: null,
                    seoName: null,
                    crop: null
                },
                pageTeaserTitle: null,
                pageTeaserText: "",
                pageTeaserSocialMediaTitle: null,
                pageTeaserSocialMediaText: "",
                pageTeaserFakePublishDate: null,
                pageTeaserExpiryDate: null,
                pageTeaserFilterTags: null,
                pageTeaserVisualTag1: null,
                pageTeaserVisualTag2: null,
                pageTeaserEventLocation: null,
                pageTeaserEventStartDate: null,
                pageTeaserEventEndDate: null
            }
        },
        pageTemplate: {
            _templateId: "basicPageTemplate",
            introZone: [
                {
                    _templateId: "stageTemplate",
                    layout: "imageLeft",
                    title: {
                        title: "my playground",
                        headingRank: null
                    },
                    stageText: {
                        root: {
                            format: null,
                            type: "root",
                            children: [
                                {
                                    children: [
                                        {
                                            mode: "normal",
                                            format: 0,
                                            style: null,
                                            detail: 0,
                                            text: "Hello Here is some text",
                                            type: "text",
                                            version: 1
                                        }
                                    ],
                                    indent: 0,
                                    format: null,
                                    styles: [
                                        {
                                            type: "typography",
                                            styleId: "paragraph1"
                                        }
                                    ],
                                    type: "paragraph-element",
                                    version: 1,
                                    direction: "ltr"
                                }
                            ],
                            indent: 0,
                            version: 1,
                            direction: "ltr"
                        }
                    },
                    button: {
                        buttonText: "Click me",
                        linkpicker: "https://www.acme.com"
                    },
                    stageMedia: {
                        file: "https://acme.com/assets/api/uuid:52e1aa7b-9f0d-4437-80e8-910e7a34e2b6/width:1036/image_small.jpeg",
                        altText: "Heat map of the world",
                        seoName: "seo name",
                        crop: "0.1248:0:0.7503:1"
                    },
                    uuid: "acme:playGroundXYZ"
                }
            ],
            mainZone: [
                {
                    _templateId: "quoteTemplate",
                    title: {
                        title: "my Quote",
                        headingRank: null
                    },
                    layout: "imageRight",
                    focusOn: "image",
                    quoteMedia: {
                        file: "https://acme.com/assets/api/uuid:4ae336d1-19c3-4ac4-b755-0cc25644eac4/no-text_original.png",
                        altText: "alt",
                        seoName: "seo-name"
                    },
                    quoteText: "so what",
                    quoteSource: "John",
                    uuid: "acme:098MyQuote77"
                },
                {
                    _templateId: "mediaRichtextTemplate",
                    layout: "imageRight",
                    uuid: "acme:ttJcRRPR0JP",
                    title: {
                        title: "my MRT",
                        headingRank: "h3"
                    },
                    subtitle: "The MRT subtitle",
                    text: {
                        root: {
                            format: null,
                            type: "root",
                            children: [
                                {
                                    children: [
                                        {
                                            mode: "normal",
                                            format: 0,
                                            style: null,
                                            detail: 0,
                                            text: "some nice words",
                                            type: "text",
                                            version: 1
                                        }
                                    ],
                                    indent: 0,
                                    format: null,
                                    styles: [
                                        {
                                            type: "typography",
                                            styleId: "paragraph1"
                                        }
                                    ],
                                    type: "paragraph-element",
                                    version: 1,
                                    direction: "ltr"
                                }
                            ],
                            indent: 0,
                            version: 1,
                            direction: "ltr"
                        }
                    },
                    mrtMedia: [
                        {
                            file: "https://acme.com/assets/api/uuid:4ae336d1-19c3-4ac4-b755-0cc25644eac4/sf-no-text_original.png",
                            altText: "alternative text",
                            seoName: "seo-optimized-name",
                            caption: "Hä? ",
                            captionLink: "caption Link "
                        },
                        {
                            file: "https://acme.com/assets/api/uuid:b3bddd2b-553a-483a-8bc1-20f02471ed1e/vegas-toureiffel_original.mp4",
                            altText: null,
                            seoName: null,
                            caption: null,
                            captionLink: null
                        }
                    ],
                    button: {
                        buttonText: "Click me",
                        linkpicker: "https://www.acme.com"
                    },
                    linklist: [
                        {
                            text: "my first link ",
                            linkpicker: "http://www.domain.com"
                        }
                    ]
                },
                {
                    _templateId: "contentTeaserRowTemplate",
                    layout: null,
                    title: {
                        title: "CTR title",
                        headingRank: null
                    },
                    contentTeaserRowCards: [
                        {
                            _templateId: "contentTeaserRowCardTemplate",
                            contentTeaserRowMediaMedia: {
                                file: "https://acme.com/assets/api/uuid:fca831bb-373a-4b2c-91d3-c3284f16b613/width:1036/image_small.png",
                                altText: "asd",
                                seoName: "wdfb"
                            },
                            title: {
                                title: "inner teaser title",
                                headingRank: "h3"
                            },
                            text: {
                                root: {
                                    format: null,
                                    type: "root",
                                    children: [
                                        {
                                            children: [
                                                {
                                                    mode: "normal",
                                                    format: 0,
                                                    style: null,
                                                    detail: 0,
                                                    text: "with som etext ",
                                                    type: "text",
                                                    version: 1
                                                }
                                            ],
                                            indent: 0,
                                            format: null,
                                            styles: [
                                                {
                                                    type: "typography",
                                                    styleId: "paragraph1"
                                                }
                                            ],
                                            type: "paragraph-element",
                                            version: 1,
                                            direction: "ltr"
                                        }
                                    ],
                                    indent: 0,
                                    version: 1,
                                    direction: "ltr"
                                }
                            },
                            linklist: [],
                            uuid: "acme:hmAHkQsvr5q"
                        }
                    ],
                    uuid: "acme:LyEFKwkutww"
                }
            ]
        }
    },
    revisionSavedBy: {
        type: "admin",
        displayName: "John Doe",
        id: "667d2515df36ec000a8c8072"
    },
    tenant: "root",
    revisionModifiedOn: "2024-07-05T09:18:51.860Z",
    createdOn: "2024-06-27T12:45:56.795Z",
    modifiedOn: "2024-07-05T09:18:51.860Z",
    locked: false,
    webinyVersion: "5.40.0",
    modifiedBy: {
        type: "admin",
        displayName: "John Doe",
        id: "667d2515df36ec000a8c8072"
    }
};
