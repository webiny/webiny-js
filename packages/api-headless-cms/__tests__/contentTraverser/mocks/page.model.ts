import { createModelField } from "~/index";
import { createPrivateModelPlugin } from "~/plugins";

export const pageModel = createPrivateModelPlugin({
    modelId: "page",
    name: "Page",
    titleFieldId: "pageTitle",
    tags: ["type:model"],
    fields: [
        createModelField({
            id: "pageTitle",
            fieldId: "pageTitle",
            type: "text",
            label: "Page Title",
            help: "Title of the page",
            renderer: {
                name: "text-input"
            },
            validation: [
                {
                    name: "required",
                    message: "Please insert a page title."
                },
                {
                    name: "maxLength",
                    message: "Max length is 255.",
                    settings: {
                        value: 255
                    }
                }
            ],
            storageId: "text@pageTitle"
        }),
        createModelField({
            id: "pageType",
            fieldId: "pageType",
            type: "text",
            label: "Page Type",
            help: "Type of the page",
            renderer: {
                name: "disabled-text-input"
            },
            storageId: "text@pageType"
        }),
        createModelField({
            id: "pageSettings",
            fieldId: "pageSettings",
            list: false,
            type: "object",
            label: "Page Settings",
            renderer: {
                name: "page-settings-object"
            },
            settings: {
                fields: [
                    createModelField({
                        id: "generalPageSettings",
                        fieldId: "generalPageSettings",
                        list: false,
                        type: "object",
                        label: "General",
                        renderer: {
                            name: "general-page-settings-object"
                        },
                        settings: {
                            fields: [
                                createModelField({
                                    id: "pageSlug",
                                    fieldId: "pageSlug",
                                    type: "text",
                                    label: "Slug*",
                                    help: "Live name of this page. The field only allows latin lower-case letters, numbers, dashes. It must not be duplicating currently existing URL in the same folder. ",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "required",
                                            settings: {},
                                            message: "Value is required."
                                        },
                                        {
                                            name: "pattern",
                                            settings: {
                                                preset: "custom",
                                                regex: "^[a-z0-9-]+$"
                                            },
                                            message:
                                                "Only latin letters, numbers and dashes are allowed"
                                        },
                                        {
                                            name: "maxLength",
                                            message: "Max length is 255.",
                                            settings: {
                                                value: 255
                                            }
                                        }
                                    ],
                                    storageId: "text@pageSlug"
                                }),
                                createModelField({
                                    id: "deliveryDomain",
                                    fieldId: "deliveryDomain",
                                    type: "text",
                                    label: "Delivery Domain",
                                    help: "With inherited the page gets the domain of the parent page.If Xcelerator is selected you have to fill in defined extra mandatory properties to ensure a smooth integration into this portfolio.",
                                    renderer: {
                                        name: "select-box"
                                    },
                                    predefinedValues: {
                                        enabled: true,
                                        values: [
                                            {
                                                label: "Inherited",
                                                value: "inherited",
                                                selected: true
                                            },
                                            {
                                                label: "acme.com",
                                                value: "acme.com"
                                            },
                                            {
                                                label: "xcelerator.acme.com",
                                                value: "xcelerator.acme.com"
                                            }
                                        ]
                                    },
                                    settings: {
                                        defaultValue: "inherited"
                                    },
                                    storageId: "text@deliveryDomain"
                                }),
                                createModelField({
                                    id: "layout",
                                    fieldId: "layout",
                                    type: "text",
                                    label: "Layout",
                                    help: "Employer brand design is only allowed for this campaign.",
                                    renderer: {
                                        name: "select-box"
                                    },
                                    predefinedValues: {
                                        enabled: true,
                                        values: [
                                            {
                                                label: "Dark",
                                                value: "dark",
                                                selected: true
                                            },
                                            {
                                                label: "Employer Brand",
                                                value: "employerbrand"
                                            }
                                        ]
                                    },
                                    settings: {
                                        defaultValue: "dark"
                                    },
                                    storageId: "text@layout"
                                }),
                                createModelField({
                                    id: "pageClass",
                                    fieldId: "pageClass",
                                    type: "text",
                                    label: "Page Class*",
                                    placeholder: "Please select",
                                    renderer: {
                                        name: "select-box"
                                    },
                                    predefinedValues: {
                                        enabled: true,
                                        values: [
                                            {
                                                label: "Inspirative",
                                                value: "Inspirative"
                                            },
                                            {
                                                label: "Informative",
                                                value: "Informative"
                                            },
                                            {
                                                label: "Basic",
                                                value: "Basic"
                                            },
                                            {
                                                label: "Mandatory",
                                                value: "Mandatory"
                                            }
                                        ]
                                    },
                                    validation: [
                                        {
                                            name: "required",
                                            settings: {},
                                            message: "Value is required."
                                        }
                                    ],
                                    storageId: "text@pageClass"
                                }),
                                createModelField({
                                    id: "pageCategory",
                                    fieldId: "pageCategory",
                                    type: "text",
                                    label: "Page Category*",
                                    placeholder: "Please select",
                                    renderer: {
                                        name: "select-box"
                                    },
                                    predefinedValues: {
                                        enabled: true,
                                        values: [
                                            {
                                                label: "Family page",
                                                value: "family-page"
                                            },
                                            {
                                                label: "Detail page",
                                                value: "detail-page"
                                            },
                                            {
                                                label: "Info page",
                                                value: "info-page"
                                            },
                                            {
                                                label: "Event page",
                                                value: "event-page"
                                            },
                                            {
                                                label: "Campaign page",
                                                value: "campaign-page"
                                            },
                                            {
                                                label: "Press page",
                                                value: "press-page"
                                            },
                                            {
                                                label: "Functional only",
                                                value: "functional-only"
                                            }
                                        ]
                                    },
                                    validation: [
                                        {
                                            name: "required",
                                            settings: {},
                                            message: "Value is required."
                                        }
                                    ],
                                    storageId: "text@pageCategory"
                                }),
                                createModelField({
                                    id: "redirectUrl",
                                    fieldId: "redirectUrl",
                                    type: "text",
                                    label: "Redirect (302)",
                                    help: "If redirected you can use tags and a filled Page teaser to appear in filter results but not in search results. This redirect is defined as “temporarily” (302) to inform search engines that the URL could come back so that they try to crawl again and again. So, if the page is deleted for the current eternity, please create a 301 redirect in our Redirect tool.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "pattern",
                                            settings: {
                                                preset: "custom",
                                                regex: "^(?:https?:\\/\\/(?:\\w+\\.)+\\w+(\\/\\S*)?)|^mailto?:.+|^#.+|^(\\/\\S*)(?:\\?[^#\\s]*)?(?:#[^\\s]*)?",
                                                flag: "i"
                                            },
                                            message: "The url is invalid"
                                        }
                                    ],
                                    storageId: "text@redirectUrl"
                                }),
                                createModelField({
                                    id: "browserTabTitle",
                                    fieldId: "browserTabTitle",
                                    type: "text",
                                    label: "Browser Tab Title*",
                                    help: "Defines the title of this page that is used in the browser's tab, favorite links and most importantly on search engine results pages.Max length is 60 characters - and our brand and your country name occupy some of them by default. ",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "required",
                                            settings: {},
                                            message: "Value is required."
                                        }
                                    ],
                                    storageId: "text@browserTabTitle"
                                }),
                                createModelField({
                                    id: "description",
                                    fieldId: "description",
                                    type: "text",
                                    label: "Description*",
                                    help: "Used as part of the search snippet in search engine results page (SERP) incl. ACME search and is meant to give the user an idea of the content that exists within the page. \nLength should be between 140…160 characters incl. spaces - this can be ignored for the non-Latin characters.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "required",
                                            settings: {},
                                            message: "Value is required."
                                        }
                                    ],
                                    storageId: "text@description"
                                }),
                                createModelField({
                                    id: "customCanonicalUrl",
                                    fieldId: "customCanonicalUrl",
                                    type: "text",
                                    label: "Custom Canonical Url",
                                    help: "If not filled in, the canonical URL will be created automatically in page source code.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "pattern",
                                            settings: {
                                                preset: "custom",
                                                regex: "^(?:https?:\\/\\/(?:\\w+\\.)+\\w+(\\/\\S*)?)|^mailto?:.+|^#.+|^(\\/\\S*)(?:\\?[^#\\s]*)?(?:#[^\\s]*)?",
                                                flag: "i"
                                            },
                                            message: "The url is invalid"
                                        }
                                    ],
                                    storageId: "text@customCanonicalUrl"
                                }),
                                createModelField({
                                    id: "contentOwner",
                                    fieldId: "contentOwner",
                                    type: "text",
                                    label: "Content responsible*",
                                    help: "SCD-connected email address of the employee we need to contact if there are issues with this page or content questions.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "required",
                                            settings: {},
                                            message: "Value is required."
                                        },
                                        {
                                            name: "pattern",
                                            settings: {
                                                preset: "custom",
                                                regex: "^\\w[\\+\\w.-]*@acme.com$",
                                                flags: "i"
                                            },
                                            message: "Email must be a @acme-com address"
                                        }
                                    ],
                                    storageId: "text@contentOwner"
                                }),
                                createModelField({
                                    id: "organisation",
                                    fieldId: "organisation",
                                    type: "text",
                                    label: "Organisation*",
                                    help: "Select the content responsible org unit for correct internal analytics data.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "required",
                                            settings: {},
                                            message: "Value is required."
                                        }
                                    ],
                                    storageId: "text@organisation"
                                }),
                                createModelField({
                                    id: "navTitle",
                                    fieldId: "navTitle",
                                    type: "text",
                                    label: "Navigation and breadcrumb title",
                                    help: "Page name to be displayed in the navigation and breadcrumb. Avoid to use “ACME”, it should be clear for the user where he is.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "maxLength",
                                            message: "Max length is 255.",
                                            settings: {
                                                value: 255
                                            }
                                        }
                                    ],
                                    storageId: "text@navTitle"
                                }),
                                createModelField({
                                    id: "hideInNavigation",
                                    fieldId: "hideInNavigation",
                                    type: "boolean",
                                    label: "Hide in navigation",
                                    renderer: {
                                        name: "boolean-input"
                                    },
                                    settings: {
                                        defaultValue: false
                                    },
                                    storageId: "boolean@hideInNavigation"
                                }),
                                createModelField({
                                    id: "hideInBreadcrumb",
                                    fieldId: "hideInBreadcrumb",
                                    type: "boolean",
                                    label: "Hide in breadcrumb",
                                    renderer: {
                                        name: "boolean-input"
                                    },
                                    settings: {
                                        defaultValue: false
                                    },
                                    storageId: "boolean@hideInBreadcrumb"
                                }),
                                createModelField({
                                    id: "noFollow",
                                    fieldId: "noFollow",
                                    type: "text",
                                    label: "Follow",
                                    help: "Prevents search engines to follow the links on this page. Use carefully and with competence.",
                                    renderer: {
                                        name: "select-box"
                                    },
                                    predefinedValues: {
                                        enabled: true,
                                        values: [
                                            {
                                                label: "Inherited",
                                                value: "inherited",
                                                selected: true
                                            },
                                            {
                                                label: "Follow",
                                                value: "follow"
                                            },
                                            {
                                                label: "No Follow",
                                                value: "no-follow"
                                            }
                                        ]
                                    },
                                    settings: {
                                        defaultValue: "inherited"
                                    },
                                    storageId: "text@noFollow"
                                }),
                                createModelField({
                                    id: "noIndex",
                                    fieldId: "noIndex",
                                    type: "text",
                                    label: "Index",
                                    help: "Prevents search engines incl. ACME internal search from indexing this page. Do not use for silent go live.",
                                    renderer: {
                                        name: "select-box"
                                    },
                                    predefinedValues: {
                                        enabled: true,
                                        values: [
                                            {
                                                label: "Inherited",
                                                value: "inherited",
                                                selected: true
                                            },
                                            {
                                                label: "Index",
                                                value: "index"
                                            },
                                            {
                                                label: "No Index",
                                                value: "no-index"
                                            }
                                        ]
                                    },
                                    settings: {
                                        defaultValue: "inherited"
                                    },
                                    storageId: "text@noIndex"
                                }),
                                createModelField({
                                    id: "publishTime",
                                    fieldId: "publishTime",
                                    type: "datetime",
                                    label: "Publish",
                                    help: "Date an time this page will be published automatically. Leave empty for normal publishing process.",
                                    renderer: {
                                        name: "date-time-input"
                                    },
                                    settings: {
                                        type: "dateTimeWithoutTimezone"
                                    },
                                    storageId: "datetime@publishTime"
                                }),
                                createModelField({
                                    id: "unPublishTime",
                                    fieldId: "unPublishTime",
                                    type: "datetime",
                                    label: "Unpublish",
                                    help: "Date an time this page will be published automatically. Please be aware of possible 404 errors - better leave empty for normal unpublishing process.",
                                    renderer: {
                                        name: "date-time-input"
                                    },
                                    settings: {
                                        type: "dateTimeWithoutTimezone"
                                    },
                                    storageId: "datetime@unPublishTime"
                                }),
                                createModelField({
                                    id: "headerContactLink",
                                    fieldId: "headerContactLink",
                                    label: "Header contact link",
                                    type: "text",
                                    placeholder: "Inherited from parent",
                                    help: "If not filled in, inherited from parent page, if filled in, it inherits to child pages.The displayed text is pulled from an i18n list.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "pattern",
                                            settings: {
                                                preset: "custom",
                                                regex: "^(?:https?:\\/\\/(?:\\w+\\.)+\\w+(\\/\\S*)?)|^mailto?:.+|^#.+|^(\\/\\S*)(?:\\?[^#\\s]*)?(?:#[^\\s]*)?",
                                                flag: "i"
                                            },
                                            message: "The url is invalid"
                                        }
                                    ],
                                    storageId: "text@headerContactLink"
                                }),
                                createModelField({
                                    id: "copyRightText",
                                    fieldId: "copyRightText",
                                    label: "Copyright text",
                                    type: "text",
                                    placeholder: "Inherited from parent",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    storageId: "text@copyRightText"
                                }),
                                createModelField({
                                    id: "inheritFooterLinks",
                                    fieldId: "inheritFooterLinks",
                                    label: "Inherit Footer links",
                                    type: "boolean",
                                    validation: [],
                                    renderer: {
                                        name: "boolean-input"
                                    },
                                    settings: {
                                        defaultValue: true
                                    },
                                    predefinedValues: {
                                        enabled: false,
                                        values: []
                                    },
                                    storageId: "boolean@inheritFooterLinks"
                                }),
                                createModelField({
                                    id: "footerLinkList",
                                    fieldId: "footerLinkList",
                                    label: "Footer Links",
                                    type: "object",
                                    list: true,
                                    renderer: {
                                        name: "objects"
                                    },
                                    settings: {
                                        fields: [
                                            createModelField({
                                                type: "text",
                                                validation: [
                                                    {
                                                        name: "required",
                                                        message: "Value is required."
                                                    }
                                                ],
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                label: "Link Text",
                                                help: "Mandatory. For SEO avoid terms like “More” or “Click here”.",
                                                fieldId: "footerLinkText",
                                                id: "footerLinkText",
                                                storageId: "text@footerLinkText"
                                            }),
                                            createModelField({
                                                type: "text",
                                                validation: [
                                                    {
                                                        name: "required",
                                                        message: "Value is required."
                                                    },
                                                    {
                                                        name: "pattern",
                                                        settings: {
                                                            preset: "url"
                                                        },
                                                        message: "URL Format is required"
                                                    }
                                                ],
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                label: "Link",
                                                help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                fieldId: "footerLinkLink",
                                                id: "footerLinkLink",
                                                storageId: "text@footerLinkLink"
                                            })
                                        ],
                                        layout: [["footerLinkText"], ["footerLinkLink"]]
                                    },
                                    storageId: "object@footerLinkList"
                                }),
                                createModelField({
                                    id: "inheritSocialMediaLinks",
                                    fieldId: "inheritSocialMediaLinks",
                                    label: "Inherit Social Media links",
                                    type: "boolean",
                                    validation: [],
                                    renderer: {
                                        name: "boolean-input"
                                    },
                                    settings: {
                                        defaultValue: true
                                    },
                                    predefinedValues: {
                                        enabled: false,
                                        values: []
                                    },
                                    storageId: "boolean@inheritSocialMediaLinks"
                                }),
                                createModelField({
                                    id: "socialMediaLinkList",
                                    fieldId: "socialMediaLinkList",
                                    label: "Social Media Links",
                                    type: "object",
                                    list: true,
                                    renderer: {
                                        name: "objects"
                                    },
                                    settings: {
                                        fields: [
                                            createModelField({
                                                type: "text",
                                                validation: [],
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                label: "Link",
                                                help: "The links are inherited to all child pages up to the moment, when a child page has its own entry.",
                                                fieldId: "socialMediaLinkLink",
                                                id: "socialMediaLinkLink",
                                                storageId: "text@socialMediaLinkLink"
                                            })
                                        ],
                                        layout: [["socialMediaLinkLink"]]
                                    },
                                    storageId: "object@socialMediaLinkList"
                                }),
                                createModelField({
                                    type: "text",
                                    validation: [],
                                    renderer: {
                                        name: "text-input"
                                    },
                                    label: "FragmentUUID",
                                    help: "The technical ID of this element.",
                                    fieldId: "uuid",
                                    id: "pageUuid",
                                    storageId: "text@pageUuid"
                                })
                            ],
                            layout: [
                                ["pageSlug", "deliveryDomain", "layout"],
                                ["pageClass", "pageCategory"],
                                ["redirectUrl"],
                                ["browserTabTitle", "description"],
                                ["customCanonicalUrl"],
                                ["contentOwner", "organisation"],
                                ["navTitle", "hideInNavigation", "hideInBreadcrumb"],
                                ["noIndex", "noFollow"],
                                ["publishTime", "unPublishTime"],
                                ["headerContactLink"],
                                ["copyRightText"],
                                ["inheritFooterLinks", "footerLinkList"],
                                ["inheritSocialMediaLinks", "socialMediaLinkList"],
                                ["pageUuid"]
                            ]
                        },
                        storageId: "object@generalPageSettings"
                    }),
                    createModelField({
                        id: "pageTeaserSettings",
                        fieldId: "pageTeaserSettings",
                        list: false,
                        type: "object",
                        label: "Page Teaser",
                        renderer: {
                            name: "page-teaser-settings-object"
                        },
                        settings: {
                            fields: [
                                createModelField({
                                    type: "object",
                                    validation: [],
                                    list: false,
                                    renderer: {
                                        name: "asset-input"
                                    },
                                    label: "Media",
                                    fieldId: "pageTeaserMedia",
                                    id: "pageTeaserMedia",
                                    storageId: "object@pageTeaserMedia",
                                    settings: {
                                        fields: [
                                            createModelField({
                                                type: "file",
                                                list: false,
                                                label: "File",
                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                fieldId: "file",
                                                id: "pageTeaserMediaFile",
                                                storageId: "file@pageTeaserMediaFile"
                                            }),
                                            createModelField({
                                                type: "text",
                                                list: false,
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                label: "Alternative text",
                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                fieldId: "altText",
                                                id: "pageTeaserMediaAltText",
                                                storageId: "text@pageTeaserMediaAltText"
                                            }),
                                            createModelField({
                                                type: "text",
                                                list: false,
                                                renderer: {
                                                    name: "slug-field-input"
                                                },
                                                label: "SEO name",
                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                fieldId: "seoName",
                                                id: "pageTeaserMediaSeoName",
                                                storageId: "text@pageTeaserMediaSeoName"
                                            }),
                                            createModelField({
                                                type: "text",
                                                validation: [],
                                                renderer: {
                                                    name: "text-and-copy-input"
                                                },
                                                label: "Crop values",
                                                help: "The value used to crop this media.",
                                                fieldId: "crop",
                                                id: "pageTeaserMediaCrop",
                                                storageId: "text@pageTeaserMediaCrop",
                                                settings: {
                                                    disabled: true
                                                }
                                            })
                                        ],
                                        layout: [
                                            ["pageTeaserMediaFile"],
                                            ["pageTeaserMediaAltText"],
                                            ["pageTeaserMediaSeoName"],
                                            ["pageTeaserMediaCrop"]
                                        ]
                                    }
                                }),
                                createModelField({
                                    id: "pageTeaserTitle",
                                    fieldId: "pageTeaserTitle",
                                    type: "text",
                                    label: "Teaser title on acme.com",
                                    help: "If you use more than 150 characters incl. spaces it could be that the text will be shortened by the destination page. Please avoid the word “ACME”: teasers appear only on acme.com",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "maxLength",
                                            message: "Max length is 255.",
                                            settings: {
                                                value: 255
                                            }
                                        }
                                    ],
                                    storageId: "text@pageTeaserTitle"
                                }),
                                createModelField({
                                    id: "pageTeaserText",
                                    fieldId: "pageTeaserText",
                                    type: "long-text",
                                    label: "Teaser text on acme.com",
                                    help: "If you use more than 150 characters incl. spaces it could be that the text will be shortened by the destination page.Please write in the first person: teasers appear only on acme.com.",
                                    renderer: {
                                        name: "long-text-text-area"
                                    },
                                    storageId: "long-text@pageTeaserText"
                                }),
                                createModelField({
                                    id: "pageTeaserSocialMediaTitle",
                                    fieldId: "pageTeaserSocialMediaTitle",
                                    type: "text",
                                    label: "Teaser title for social media",
                                    help: "",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "maxLength",
                                            message: "Max length is 255.",
                                            settings: {
                                                value: 255
                                            }
                                        }
                                    ],
                                    storageId: "text@pageTeaserSocialMediaTitle"
                                }),
                                createModelField({
                                    id: "pageTeaserSocialMediaText",
                                    fieldId: "pageTeaserSocialMediaText",
                                    type: "long-text",
                                    label: "Teaser text for social media",
                                    help: "",
                                    renderer: {
                                        name: "long-text-text-area"
                                    },
                                    storageId: "long-text@pageTeaserSocialMediaText"
                                }),
                                createModelField({
                                    id: "pageTeaserFakePublishDate",
                                    fieldId: "pageTeaserFakePublishDate",
                                    type: "datetime",
                                    label: "Fake publish",
                                    help: "For filter results sorting or feeding the recommendation engine with the real age of the page.The source code and sitemap.xml date, read by search engines, shows the real publish date.",
                                    renderer: {
                                        name: "date-time-input"
                                    },
                                    settings: {
                                        type: "dateTimeWithoutTimezone"
                                    },
                                    storageId: "datetime@pageTeaserFakePublishDate"
                                }),
                                createModelField({
                                    id: "pageTeaserExpiryDate",
                                    fieldId: "pageTeaserExpiryDate",
                                    type: "datetime",
                                    label: "Expire",
                                    help: "In Filter results the teaser will not be shown if a expire date is set. The page itself is not affected.",
                                    renderer: {
                                        name: "date-time-input"
                                    },
                                    settings: {
                                        type: "dateTimeWithoutTimezone"
                                    },
                                    storageId: "datetime@pageTeaserExpiryDate"
                                }),
                                createModelField({
                                    id: "pageTeaserFilterTags",
                                    fieldId: "pageTeaserFilterTags",
                                    type: "text",
                                    label: "Filter Tag(s)",
                                    help: "Select the tags in English. They will be translated into the browser language during delivery.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    storageId: "text@pageTeaserFilterTags"
                                }),
                                createModelField({
                                    id: "pageTeaserVisualTag1",
                                    fieldId: "pageTeaserVisualTag1",
                                    type: "text",
                                    label: "Visual Tag 1",
                                    help: "Not for filtering, only shown in the teasers' 1st topline.",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    storageId: "text@pageTeaserVisualTag1"
                                }),
                                createModelField({
                                    id: "pageTeaserVisualTag2",
                                    fieldId: "pageTeaserVisualTag2",
                                    type: "text",
                                    label: "Visual Tag 2",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    storageId: "text@pageTeaserVisualTag2"
                                }),
                                createModelField({
                                    id: "pageTeaserEventLocation",
                                    fieldId: "pageTeaserEventLocation",
                                    type: "text",
                                    label: "Event Location",
                                    help: "Please type in an event location, if needed",
                                    renderer: {
                                        name: "text-input"
                                    },
                                    storageId: "text@pageTeaserEventLocation"
                                }),
                                createModelField({
                                    id: "pageTeaserEventStartDate",
                                    fieldId: "pageTeaserEventStartDate",
                                    type: "datetime",
                                    label: "Event start",
                                    renderer: {
                                        name: "date-time-input"
                                    },
                                    settings: {
                                        type: "dateTimeWithoutTimezone"
                                    },
                                    storageId: "datetime@pageTeaserEventStartDate"
                                }),
                                createModelField({
                                    id: "pageTeaserEventEndDate",
                                    fieldId: "pageTeaserEventEndDate",
                                    type: "datetime",
                                    label: "Event end",
                                    renderer: {
                                        name: "date-time-input"
                                    },
                                    settings: {
                                        type: "dateTimeWithoutTimezone"
                                    },
                                    storageId: "datetime@pageTeaserEventEndDate"
                                })
                            ],
                            layout: [
                                ["pageTeaserMedia"],
                                ["pageTeaserTitle"],
                                ["pageTeaserText"],
                                ["pageTeaserSocialMediaTitle"],
                                ["pageTeaserSocialMediaText"],
                                ["pageTeaserFakePublishDate"],
                                ["pageTeaserExpiryDate"],
                                ["pageTeaserFilterTags"],
                                ["pageTeaserVisualTag1"],
                                ["pageTeaserVisualTag2"],
                                ["pageTeaserEventLocation"],
                                ["pageTeaserEventStartDate"],
                                ["pageTeaserEventEndDate"]
                            ]
                        },
                        storageId: "object@pageTeaserSettings"
                    })
                ],
                layout: [["generalPageSettings"], ["pageTeaserSettings"]]
            },
            storageId: "object@pageSettings"
        }),
        createModelField({
            id: "pageTemplate",
            fieldId: "pageTemplate",
            type: "dynamicZone",
            label: "Page Template",
            list: false,
            renderer: {
                name: "dynamicZone"
            },
            settings: {
                templates: [
                    {
                        validation: [],
                        name: "Basic Page",
                        gqlTypeName: "BasicPageTemplate",
                        icon: "fas/home",
                        description: "Basic Page",
                        id: "basicPageTemplate",
                        fields: [
                            createModelField({
                                id: "introZone",
                                fieldId: "introZone",
                                label: "Introduction Zone",
                                type: "dynamicZone",
                                list: true,
                                renderer: {
                                    name: "dynamicZone"
                                },
                                settings: {
                                    templates: [
                                        {
                                            name: "Stage",
                                            gqlTypeName: "Stage",
                                            icon: "fas/masks-theater",
                                            description:
                                                "1st element of every page, delivers a H1 and a short intro text.",
                                            id: "stageTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    help: "If used outside of Intro section the headline will be delivered as H2.",
                                                    label: "Layout",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "Text only",
                                                                value: "textOnly"
                                                            },
                                                            {
                                                                label: "Text with media left",
                                                                value: "imageLeft"
                                                            },
                                                            {
                                                                label: "Text with media right",
                                                                value: "imageRight",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "Panorama",
                                                                value: "panoramaImage"
                                                            },
                                                            {
                                                                label: "Full screen with background image",
                                                                value: "backgroundImageVideo"
                                                            }
                                                        ]
                                                    },
                                                    fieldId: "layout",
                                                    id: "stageLayout",
                                                    storageId: "text@stageLayout"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "stageTitle",
                                                    storageId: "object@stageTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                validation: [
                                                                    {
                                                                        name: "required",
                                                                        message:
                                                                            "Title is required."
                                                                    }
                                                                ],
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Max. 70 characters incl. spaces are allowed. If you selected layout “Text only”: unlimited.",
                                                                fieldId: "title",
                                                                id: "stageTitleTitle",
                                                                storageId: "text@stageTitleTitle",
                                                                settings: {
                                                                    inputField: {
                                                                        rows: 2
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "stageTitleHeadingRank",
                                                                storageId:
                                                                    "text@stageTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "stageTitleTitle",
                                                                "stageTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "rich-text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "enhanced-lexical-text-input"
                                                    },
                                                    label: "Text",
                                                    help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                    fieldId: "stageText",
                                                    placeholder:
                                                        "Max. 400 characters incl. spaces are allowed. If you selected the “Text only”: unlimited.",
                                                    id: "stageText",
                                                    storageId: "rich-text@stageText"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Button",
                                                    help: "The button hierarchy and design is pre-defined per component. See the showroom for details.",
                                                    fieldId: "button",
                                                    id: "stageButton",
                                                    storageId: "object@stageButton",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Button Text",
                                                                help: "About 30 characters per row, if delivered on desktop. On mobile devices please calculate with ~20.",
                                                                fieldId: "buttonText",
                                                                id: "stageButtonText",
                                                                storageId: "text@stageButtonText"
                                                            },
                                                            {
                                                                type: "text",
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Button Link",
                                                                fieldId: "linkpicker",
                                                                id: "stageButtonLink",
                                                                help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                                storageId: "text@stageButtonLink"
                                                            }
                                                        ],
                                                        layout: [
                                                            ["stageButtonText", "stageButtonLink"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "asset-input"
                                                    },
                                                    label: "Media",
                                                    help: "Image 16:9 or 4:3, video always 16:9. Gifs bigger that 6 MB might not be delivered for performance reasons.",
                                                    fieldId: "stageMedia",
                                                    id: "stageMedia",
                                                    storageId: "object@stageMedia",
                                                    settings: {
                                                        cropPresets: {
                                                            single: {
                                                                automatic: true,
                                                                defaultPreset: "4:3",
                                                                presetsList: ["4:3", "16:9"]
                                                            }
                                                        },
                                                        fields: [
                                                            {
                                                                type: "file",
                                                                list: false,
                                                                label: "File",
                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                fieldId: "file",
                                                                id: "stageMediaFile",
                                                                storageId: "file@stageMediaFile"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Alternative text",
                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                fieldId: "altText",
                                                                id: "stageMediaAltText",
                                                                storageId: "text@stageMediaAltText"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "slug-field-input"
                                                                },
                                                                label: "SEO name",
                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                fieldId: "seoName",
                                                                id: "stageMediaSeoName",
                                                                storageId: "text@stageMediaSeoName"
                                                            },
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "text-and-copy-input"
                                                                },
                                                                label: "Crop values",
                                                                help: "The value used to crop this media.",
                                                                fieldId: "crop",
                                                                id: "stageMediaCrop",
                                                                storageId: "text@stageMediaCrop",
                                                                settings: {
                                                                    disabled: true
                                                                }
                                                            }
                                                        ],
                                                        layout: [
                                                            ["stageMediaFile"],
                                                            ["stageMediaAltText"],
                                                            ["stageMediaSeoName"],
                                                            ["stageMediaCrop"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "stageUuid",
                                                    storageId: "text@stageUuid"
                                                }
                                            ],
                                            layout: [
                                                ["stageLayout"],
                                                ["stageTitle"],
                                                ["stageText"],
                                                ["stageMedia"],
                                                ["stageButton"],
                                                ["stageUuid"]
                                            ]
                                        }
                                    ]
                                },
                                storageId: "dynamicZone@introZone"
                            }),
                            createModelField({
                                id: "mainZone",
                                fieldId: "mainZone",
                                label: "Main Zone",
                                type: "dynamicZone",
                                list: true,
                                renderer: {
                                    name: "dynamicZone"
                                },
                                settings: {
                                    templates: [
                                        {
                                            name: "Accordion/Tab",
                                            gqlTypeName: "AccordionTab",
                                            icon: "fas/stairs",
                                            description:
                                                "You can easily switch from tab to accordion with one click. To avoid creating inside an accordion/tab split too much content, the title of the embedded component isn’t delivered. Be aware that the content inside the splits cannot be seen by search engines.",
                                            id: "accordionTabTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "text",
                                                    validation: [
                                                        {
                                                            name: "required",
                                                            message: "Must select Accordion or Tab"
                                                        }
                                                    ],
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    label: "Layout",
                                                    help: "For UX reasons please limit the amount of accordion splits to six.",
                                                    placeholder: "Please select",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "Accordion",
                                                                value: "accordion",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "Tab",
                                                                value: "tab"
                                                            }
                                                        ]
                                                    },
                                                    fieldId: "layout",
                                                    id: "accordionTabLayout",
                                                    storageId: "text@AccordionTabLayout"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "accordionTabTitle",
                                                    storageId: "object@accordionTabTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                fieldId: "title",
                                                                id: "accordionTabTitleTitle",
                                                                storageId:
                                                                    "text@accordionTabTitleTitle",
                                                                settings: {
                                                                    inputField: {}
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "accordionTabTitleHeadingRank",
                                                                storageId:
                                                                    "text@accordionTabTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "accordionTabTitleTitle",
                                                                "accordionTabTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: true,
                                                    renderer: {
                                                        name: "objects"
                                                    },
                                                    label: "Splits",
                                                    fieldId: "split",
                                                    id: "accordionTabSplit",
                                                    storageId: "object@AccordionTabSplit",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                validation: [
                                                                    {
                                                                        name: "required",
                                                                        message:
                                                                            "The field is required"
                                                                    }
                                                                ],
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Split title",
                                                                help: "Title, visible in tab field or closed accordion fold. Works as an anchor.",
                                                                fieldId: "splitTitle",
                                                                id: "accordionTabSplitTitle",
                                                                storageId:
                                                                    "text@accordionTabSplitTitle"
                                                            },
                                                            {
                                                                type: "dynamicZone",
                                                                list: true,
                                                                validation: [
                                                                    {
                                                                        name: "required",
                                                                        message:
                                                                            "This field is required"
                                                                    }
                                                                ],
                                                                renderer: {
                                                                    name: "dynamicZone"
                                                                },
                                                                settings: {
                                                                    templates: [
                                                                        {
                                                                            name: "Media Rich Text",
                                                                            gqlTypeName:
                                                                                "MediaRichText",
                                                                            icon: "fas/align-left",
                                                                            description:
                                                                                "Media Rich Text Component : Text and image a/o video side-by-side. Enrich-able with title, subtitle link list or button.",
                                                                            id: "mediaRichtextTemplate",
                                                                            validation: [],
                                                                            fields: [
                                                                                {
                                                                                    type: "text",
                                                                                    renderer: {
                                                                                        name: "select-box"
                                                                                    },
                                                                                    help: "If single image, the ratio is free. For more than one it is set to 16:9.",
                                                                                    label: "Layout",
                                                                                    predefinedValues:
                                                                                        {
                                                                                            enabled: true,
                                                                                            values: [
                                                                                                {
                                                                                                    label: "Media position left",
                                                                                                    value: "imageLeft",
                                                                                                    selected: true
                                                                                                },
                                                                                                {
                                                                                                    label: "Media position right",
                                                                                                    value: "imageRight"
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                    fieldId:
                                                                                        "layout",
                                                                                    id: "mrtLayout",
                                                                                    storageId:
                                                                                        "text@mrtLayout"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "FragmentUUID",
                                                                                    help: "The technical ID of this element.",
                                                                                    fieldId: "uuid",
                                                                                    id: "mrtUuid",
                                                                                    storageId:
                                                                                        "text@mrtUuid"
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "object"
                                                                                    },
                                                                                    label: "Title",
                                                                                    fieldId:
                                                                                        "title",
                                                                                    id: "mrtTitle",
                                                                                    storageId:
                                                                                        "object@mrtTitle",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "enhanced-text-input"
                                                                                                    },
                                                                                                label: "Title",
                                                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                                                fieldId:
                                                                                                    "title",
                                                                                                id: "mrtTitleTitle",
                                                                                                storageId:
                                                                                                    "text@mrtTitleTitle",
                                                                                                settings:
                                                                                                    {
                                                                                                        inputField:
                                                                                                            {}
                                                                                                    }
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                validation:
                                                                                                    [],
                                                                                                predefinedValues:
                                                                                                    {
                                                                                                        enabled: true,
                                                                                                        values: [
                                                                                                            {
                                                                                                                label: "Auto generated",
                                                                                                                value: "auto",
                                                                                                                selected: true
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H2",
                                                                                                                value: "h2"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H3",
                                                                                                                value: "h3"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H4",
                                                                                                                value: "h4"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H5",
                                                                                                                value: "h5"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H6",
                                                                                                                value: "h6"
                                                                                                            }
                                                                                                        ]
                                                                                                    },
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "select-box"
                                                                                                    },
                                                                                                label: "Heading Rank",
                                                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                                                fieldId:
                                                                                                    "headingRank",
                                                                                                id: "mrtTitleHeadingRank",
                                                                                                storageId:
                                                                                                    "text@mrtTitleHeadingRank"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "mrtTitleTitle",
                                                                                                "mrtTitleHeadingRank"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Subtitle",
                                                                                    help: "Plain text, max 150 characters.",
                                                                                    fieldId:
                                                                                        "subtitle",
                                                                                    id: "mrtSubtitle",
                                                                                    storageId:
                                                                                        "text@mrtSubtitle"
                                                                                },
                                                                                {
                                                                                    type: "rich-text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "enhanced-lexical-text-input"
                                                                                    },
                                                                                    label: "Text",
                                                                                    help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                                                    fieldId: "text",
                                                                                    id: "mrtRichText",
                                                                                    storageId:
                                                                                        "rich-text@mrtRichText"
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: true,
                                                                                    renderer: {
                                                                                        name: "asset-input"
                                                                                    },
                                                                                    label: "Media",
                                                                                    help: "The ratio is free for single images. For multiple images the ratio is fixed at 16:9.",
                                                                                    fieldId:
                                                                                        "mrtMedia",
                                                                                    id: "mrtMedia",
                                                                                    storageId:
                                                                                        "object@mrtMedia",
                                                                                    settings: {
                                                                                        cropPresets:
                                                                                            {
                                                                                                single: {
                                                                                                    presetsList:
                                                                                                        [
                                                                                                            "EMPTY"
                                                                                                        ]
                                                                                                },
                                                                                                multiple:
                                                                                                    {
                                                                                                        presetsList:
                                                                                                            [
                                                                                                                "16:9"
                                                                                                            ]
                                                                                                    }
                                                                                            },
                                                                                        fields: [
                                                                                            {
                                                                                                type: "file",
                                                                                                list: false,
                                                                                                label: "File",
                                                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                                                fieldId:
                                                                                                    "file",
                                                                                                id: "mrtMediaFile",
                                                                                                storageId:
                                                                                                    "file@mrtMediaFile"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Alternative text",
                                                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                                                fieldId:
                                                                                                    "altText",
                                                                                                id: "mrtMediaAltText",
                                                                                                storageId:
                                                                                                    "text@mrtMediaAltText"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "slug-field-input"
                                                                                                    },
                                                                                                label: "SEO name",
                                                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                                                fieldId:
                                                                                                    "seoName",
                                                                                                id: "mrtMediaSeoName",
                                                                                                storageId:
                                                                                                    "text@mrtMediaSeoName"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Caption",
                                                                                                help: "Text length is max. 300 characters incl. spaces.",
                                                                                                fieldId:
                                                                                                    "caption",
                                                                                                id: "mrtMediaCaption",
                                                                                                storageId:
                                                                                                    "text@mrtMediaCaption",
                                                                                                validation:
                                                                                                    [
                                                                                                        {
                                                                                                            name: "maxLength",
                                                                                                            message:
                                                                                                                "Caption is longer then 300 characters.",
                                                                                                            settings:
                                                                                                                {
                                                                                                                    value: 300
                                                                                                                }
                                                                                                        }
                                                                                                    ]
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Caption link",
                                                                                                help: "The link affects the complete text, not single words.",
                                                                                                fieldId:
                                                                                                    "captionLink",
                                                                                                id: "mrtMediaCaptionLink",
                                                                                                storageId:
                                                                                                    "text@mrtMediaCaptionLink"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                validation:
                                                                                                    [],
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-and-copy-input"
                                                                                                    },
                                                                                                label: "Crop values",
                                                                                                help: "The value used to crop this media.",
                                                                                                fieldId:
                                                                                                    "crop",
                                                                                                id: "mrtMediaCrop",
                                                                                                storageId:
                                                                                                    "text@mrtMediaCrop",
                                                                                                settings:
                                                                                                    {
                                                                                                        disabled: true
                                                                                                    }
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "mrtMediaFile"
                                                                                            ],
                                                                                            [
                                                                                                "mrtMediaAltText"
                                                                                            ],
                                                                                            [
                                                                                                "mrtMediaSeoName"
                                                                                            ],
                                                                                            [
                                                                                                "mrtMediaCaption"
                                                                                            ],
                                                                                            [
                                                                                                "mrtMediaCaptionLink"
                                                                                            ],
                                                                                            [
                                                                                                "mrtMediaCrop"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "object"
                                                                                    },
                                                                                    label: "Button",
                                                                                    help: "The button hierarchy and design is pre-defined per component. See the showroom for details.",
                                                                                    fieldId:
                                                                                        "button",
                                                                                    id: "mrtButton",
                                                                                    storageId:
                                                                                        "object@mrtButton",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                validation:
                                                                                                    [],
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Button Text",
                                                                                                help: "About 30 characters per row, if delivered on desktop. On mobile devices please calculate with ~20.",
                                                                                                fieldId:
                                                                                                    "buttonText",
                                                                                                id: "mrtButtonText",
                                                                                                storageId:
                                                                                                    "text@mrtButtonText"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Button Link",
                                                                                                fieldId:
                                                                                                    "linkpicker",
                                                                                                id: "mrtButtonLink",
                                                                                                help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                                                                storageId:
                                                                                                    "text@mrtButtonLink"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "mrtButtonText",
                                                                                                "mrtButtonLink"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: true,
                                                                                    renderer: {
                                                                                        name: "objects"
                                                                                    },
                                                                                    label: "LinkList",
                                                                                    fieldId:
                                                                                        "linklist",
                                                                                    id: "mrtLinkList",
                                                                                    storageId:
                                                                                        "object@mrtLinkList",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                validation:
                                                                                                    [
                                                                                                        {
                                                                                                            name: "required",
                                                                                                            message:
                                                                                                                "Value is required."
                                                                                                        }
                                                                                                    ],
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Link Text",
                                                                                                help: "Mandatory. For SEO avoid terms like “More” or “Click here”.",
                                                                                                fieldId:
                                                                                                    "text",
                                                                                                id: "mrtLinkListText",
                                                                                                storageId:
                                                                                                    "text@mrtLinkListText"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                validation:
                                                                                                    [
                                                                                                        {
                                                                                                            name: "required",
                                                                                                            message:
                                                                                                                "Value is required."
                                                                                                        }
                                                                                                    ],
                                                                                                label: "Link",
                                                                                                fieldId:
                                                                                                    "linkpicker",
                                                                                                id: "mrtLinkListLink",
                                                                                                help: "If link is SmartCMS internal, create link relative via <Picker> to avoid 404 errors",
                                                                                                storageId:
                                                                                                    "text@mrtLinkListLink"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "mrtLinkListText"
                                                                                            ],
                                                                                            [
                                                                                                "mrtLinkListLink"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                ["mrtLayout"],
                                                                                ["mrtTitle"],
                                                                                ["mrtSubtitle"],
                                                                                ["mrtRichText"],
                                                                                ["mrtMedia"],
                                                                                ["mrtButton"],
                                                                                ["mrtLinkList"],
                                                                                ["mrtUuid"]
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: "Gallery",
                                                                            gqlTypeName: "Gallery",
                                                                            icon: "fas/file-video",
                                                                            description:
                                                                                "Image a/o video slider which fills the complete browser width. Linked caption optional.",
                                                                            id: "galleryTemplate",
                                                                            validation: [],
                                                                            fields: [
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "object"
                                                                                    },
                                                                                    label: "Title",
                                                                                    fieldId:
                                                                                        "title",
                                                                                    id: "galleryTitle",
                                                                                    storageId:
                                                                                        "object@galleryTitle",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "enhanced-text-input"
                                                                                                    },
                                                                                                label: "Title",
                                                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                                                fieldId:
                                                                                                    "title",
                                                                                                id: "galleryTitleTitle",
                                                                                                storageId:
                                                                                                    "text@galleryTitleTitle",
                                                                                                settings:
                                                                                                    {
                                                                                                        inputField:
                                                                                                            {}
                                                                                                    }
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                validation:
                                                                                                    [],
                                                                                                predefinedValues:
                                                                                                    {
                                                                                                        enabled: true,
                                                                                                        values: [
                                                                                                            {
                                                                                                                label: "Auto generated",
                                                                                                                value: "auto",
                                                                                                                selected: true
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H2",
                                                                                                                value: "h2"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H3",
                                                                                                                value: "h3"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H4",
                                                                                                                value: "h4"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H5",
                                                                                                                value: "h5"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H6",
                                                                                                                value: "h6"
                                                                                                            }
                                                                                                        ]
                                                                                                    },
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "select-box"
                                                                                                    },
                                                                                                label: "Heading Rank",
                                                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                                                fieldId:
                                                                                                    "headingRank",
                                                                                                id: "galleryTitleHeadingRank",
                                                                                                storageId:
                                                                                                    "text@galleryTitleHeadingRank"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "galleryTitleTitle",
                                                                                                "galleryTitleHeadingRank"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "object"
                                                                                    },
                                                                                    label: "Show on all images",
                                                                                    help: "You can switch off/on the magnifier and/or the download icon, but only for all images - and not for videos",
                                                                                    fieldId:
                                                                                        "showOnAllImages",
                                                                                    id: "galleryShowOnAllImage",
                                                                                    storageId:
                                                                                        "object@galleryShowOnAllImage",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "boolean",
                                                                                                validation:
                                                                                                    [],
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "boolean-input"
                                                                                                    },
                                                                                                label: "Magnifier",
                                                                                                fieldId:
                                                                                                    "galleryMagnifier",
                                                                                                id: "galleryMagnifier",
                                                                                                storageId:
                                                                                                    "text@galleryMagnifier"
                                                                                            },
                                                                                            {
                                                                                                type: "boolean",
                                                                                                validation:
                                                                                                    [],
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "boolean-input"
                                                                                                    },
                                                                                                label: "Download icon",
                                                                                                fieldId:
                                                                                                    "galleryDownloadIcon",
                                                                                                id: "galleryDownloadIcon",
                                                                                                storageId:
                                                                                                    "text@galleryDownloadIcon"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "galleryMagnifier",
                                                                                                "galleryDownloadIcon"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: true,
                                                                                    renderer: {
                                                                                        name: "asset-input"
                                                                                    },
                                                                                    label: "Media",
                                                                                    help: "The ratio is free for single images. For multiple images the ratio is fixed at 16:9.",
                                                                                    fieldId:
                                                                                        "galleryMedia",
                                                                                    id: "galleryMedia",
                                                                                    storageId:
                                                                                        "object@galleryMedia",
                                                                                    settings: {
                                                                                        contentType:
                                                                                            [
                                                                                                "IMAGES",
                                                                                                "VIDEOS"
                                                                                            ],
                                                                                        cropPresets:
                                                                                            {
                                                                                                single: {
                                                                                                    presetsList:
                                                                                                        [
                                                                                                            "EMPTY"
                                                                                                        ]
                                                                                                },
                                                                                                multiple:
                                                                                                    {
                                                                                                        presetsList:
                                                                                                            [
                                                                                                                "16:9"
                                                                                                            ]
                                                                                                    }
                                                                                            },
                                                                                        fields: [
                                                                                            {
                                                                                                type: "file",
                                                                                                list: false,
                                                                                                label: "File",
                                                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                                                fieldId:
                                                                                                    "file",
                                                                                                id: "galleryMediaFile",
                                                                                                storageId:
                                                                                                    "file@galleryMediaFile"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Alternative text",
                                                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                                                fieldId:
                                                                                                    "altText",
                                                                                                id: "galleryMediaAltText",
                                                                                                storageId:
                                                                                                    "text@galleryMediaAltText"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "slug-field-input"
                                                                                                    },
                                                                                                label: "SEO name",
                                                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                                                fieldId:
                                                                                                    "seoName",
                                                                                                id: "galleryMediaSeoName",
                                                                                                storageId:
                                                                                                    "text@galleryMediaSeoName"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Caption",
                                                                                                help: "Text length is max. 300 characters incl. spaces.",
                                                                                                fieldId:
                                                                                                    "caption",
                                                                                                id: "galleryMediaCaption",
                                                                                                storageId:
                                                                                                    "text@galleryMediaCaption",
                                                                                                validation:
                                                                                                    [
                                                                                                        {
                                                                                                            name: "maxLength",
                                                                                                            message:
                                                                                                                "Caption is longer then 300 characters.",
                                                                                                            settings:
                                                                                                                {
                                                                                                                    value: 300
                                                                                                                }
                                                                                                        }
                                                                                                    ]
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Caption link",
                                                                                                help: "The link affects the complete text, not single words.",
                                                                                                fieldId:
                                                                                                    "captionLink",
                                                                                                id: "galleryMediaCaptionLink",
                                                                                                storageId:
                                                                                                    "text@galleryMediaCaptionLink"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                validation:
                                                                                                    [],
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-and-copy-input"
                                                                                                    },
                                                                                                label: "Crop values",
                                                                                                help: "The value used to crop this media.",
                                                                                                fieldId:
                                                                                                    "crop",
                                                                                                id: "galleryMediaCrop",
                                                                                                storageId:
                                                                                                    "text@galleryMediaCrop",
                                                                                                settings:
                                                                                                    {
                                                                                                        disabled: true
                                                                                                    }
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "galleryMediaFile"
                                                                                            ],
                                                                                            [
                                                                                                "galleryMediaAltText"
                                                                                            ],
                                                                                            [
                                                                                                "galleryMediaSeoName"
                                                                                            ],
                                                                                            [
                                                                                                "galleryMediaCaption"
                                                                                            ],
                                                                                            [
                                                                                                "galleryMediaCaptionLink"
                                                                                            ],
                                                                                            [
                                                                                                "galleryMediaCrop"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "FragmentUUID",
                                                                                    help: "The technical ID of this element.",
                                                                                    fieldId: "uuid",
                                                                                    id: "galleryUuid",
                                                                                    storageId:
                                                                                        "text@galleryUuid"
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                ["galleryTitle"],
                                                                                [
                                                                                    "galleryShowOnAllImage"
                                                                                ],
                                                                                ["galleryMedia"],
                                                                                ["galleryUuid"]
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: "Teaser Card",
                                                                            gqlTypeName:
                                                                                "ContentTeaserRowCard",
                                                                            icon: "fas/receipt",
                                                                            description:
                                                                                "A teaser card with an image or video, rich text and link list or button.",
                                                                            id: "contentTeaserRowCardTemplate",
                                                                            validation: [],
                                                                            fields: [
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "asset-input"
                                                                                    },
                                                                                    label: "Media",
                                                                                    fieldId:
                                                                                        "contentTeaserRowMediaMedia",
                                                                                    id: "contentTeaserRowMedia",
                                                                                    storageId:
                                                                                        "object@contentTeaserRowMedia",
                                                                                    settings: {
                                                                                        cropPresets:
                                                                                            {
                                                                                                single: {
                                                                                                    presetsList:
                                                                                                        [
                                                                                                            "16:9"
                                                                                                        ]
                                                                                                }
                                                                                            },
                                                                                        fields: [
                                                                                            {
                                                                                                type: "file",
                                                                                                list: false,
                                                                                                label: "File",
                                                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                                                fieldId:
                                                                                                    "file",
                                                                                                id: "contentTeaserRowMediaFile",
                                                                                                storageId:
                                                                                                    "file@contentTeaserRowMediaFile"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Alternative text",
                                                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                                                fieldId:
                                                                                                    "altText",
                                                                                                id: "contentTeaserRowMediaAltText",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowMediaAltText"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "slug-field-input"
                                                                                                    },
                                                                                                label: "SEO name",
                                                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                                                fieldId:
                                                                                                    "seoName",
                                                                                                id: "contentTeaserRowMediaSeoName",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowMediaSeoName"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                validation:
                                                                                                    [],
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-and-copy-input"
                                                                                                    },
                                                                                                label: "Crop values",
                                                                                                help: "The value used to crop this media.",
                                                                                                fieldId:
                                                                                                    "crop",
                                                                                                id: "contentTeaserRowMediaCrop",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowMediaCrop",
                                                                                                settings:
                                                                                                    {
                                                                                                        disabled: true
                                                                                                    }
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "contentTeaserRowMediaFile"
                                                                                            ],
                                                                                            [
                                                                                                "contentTeaserRowMediaAltText"
                                                                                            ],
                                                                                            [
                                                                                                "contentTeaserRowMediaSeoName"
                                                                                            ],
                                                                                            [
                                                                                                "contentTeaserRowMediaCrop"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "object"
                                                                                    },
                                                                                    label: "Teaser Title",
                                                                                    fieldId:
                                                                                        "title",
                                                                                    id: "contentTeaserRowTeaserTitle",
                                                                                    storageId:
                                                                                        "object@contentTeaserRowTeaserTitle",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "enhanced-text-input"
                                                                                                    },
                                                                                                label: "Title",
                                                                                                help: "If teaser title and text missing, the teaser will not be delivered.",
                                                                                                fieldId:
                                                                                                    "title",
                                                                                                id: "contentTeaserRowTeaserTitleTitle",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowTeaserTitleTitle",
                                                                                                settings:
                                                                                                    {
                                                                                                        inputField:
                                                                                                            {}
                                                                                                    }
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                validation:
                                                                                                    [],
                                                                                                predefinedValues:
                                                                                                    {
                                                                                                        enabled: true,
                                                                                                        values: [
                                                                                                            {
                                                                                                                label: "Auto generated",
                                                                                                                value: "auto",
                                                                                                                selected: true
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H2",
                                                                                                                value: "h2"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H3",
                                                                                                                value: "h3"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H4",
                                                                                                                value: "h4"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H5",
                                                                                                                value: "h5"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H6",
                                                                                                                value: "h6"
                                                                                                            }
                                                                                                        ]
                                                                                                    },
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "select-box"
                                                                                                    },
                                                                                                label: "Heading Rank",
                                                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                                                fieldId:
                                                                                                    "headingRank",
                                                                                                id: "contentTeaserRowTeaserTitleHeadingRank",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowTeaserTitleHeadingRank"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "contentTeaserRowTeaserTitleTitle",
                                                                                                "contentTeaserRowTeaserTitleHeadingRank"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "rich-text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "enhanced-lexical-text-input"
                                                                                    },
                                                                                    label: "Text",
                                                                                    help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                                                    fieldId: "text",
                                                                                    id: "contentTeaserRowRichText",
                                                                                    storageId:
                                                                                        "rich-text@contentTeaserRowRichText"
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "object"
                                                                                    },
                                                                                    label: "Button",
                                                                                    help: "The button hierarchy and design is pre-defined per component. See the showroom for details.",
                                                                                    fieldId:
                                                                                        "button",
                                                                                    id: "contentTeaserRowButton",
                                                                                    storageId:
                                                                                        "object@contentTeaserRowButton",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                validation:
                                                                                                    [],
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Button Text",
                                                                                                help: "About 30 characters per row, if delivered on desktop. On mobile devices please calculate with ~20.",
                                                                                                fieldId:
                                                                                                    "buttonText",
                                                                                                id: "contentTeaserRowButtonText",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowButtonText"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Button Link",
                                                                                                fieldId:
                                                                                                    "linkpicker",
                                                                                                id: "contentTeaserRowButtonLink",
                                                                                                help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowButtonLink"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "contentTeaserRowButtonText",
                                                                                                "contentTeaserRowButtonLink"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: true,
                                                                                    renderer: {
                                                                                        name: "objects"
                                                                                    },
                                                                                    label: "LinkList",
                                                                                    fieldId:
                                                                                        "linklist",
                                                                                    id: "contentTeaserRowLinkList",
                                                                                    storageId:
                                                                                        "object@contentTeaserRowLinkList",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                validation:
                                                                                                    [
                                                                                                        {
                                                                                                            name: "required",
                                                                                                            message:
                                                                                                                "Value is required."
                                                                                                        }
                                                                                                    ],
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                label: "Link Text",
                                                                                                help: "Mandatory. For SEO avoid terms like “More” or “Click here”.",
                                                                                                fieldId:
                                                                                                    "text",
                                                                                                id: "contentTeaserRowLinkListText",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowLinkListText"
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "text-input"
                                                                                                    },
                                                                                                validation:
                                                                                                    [
                                                                                                        {
                                                                                                            name: "required",
                                                                                                            message:
                                                                                                                "Value is required."
                                                                                                        }
                                                                                                    ],
                                                                                                label: "Link",
                                                                                                fieldId:
                                                                                                    "linkpicker",
                                                                                                id: "contentTeaserRowLinkListLink",
                                                                                                help: "If link is SmartCMS internal, create link relative via <Picker> to avoid 404 errors",
                                                                                                storageId:
                                                                                                    "text@contentTeaserRowLinkListLink"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "contentTeaserRowLinkListText"
                                                                                            ],
                                                                                            [
                                                                                                "contentTeaserRowLinkListLink"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "FragmentUUID",
                                                                                    help: "The technical ID of this element.",
                                                                                    fieldId: "uuid",
                                                                                    id: "contentTeaserRowUuid",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowUuid"
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "contentTeaserRowMedia"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowTeaserTitle"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowRichText"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowButton"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowLinkList"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowUuid"
                                                                                ]
                                                                            ]
                                                                        },
                                                                        {
                                                                            name: "Teaser Routing",
                                                                            gqlTypeName:
                                                                                "TeaserRouting",
                                                                            icon: "fas/table-columns",
                                                                            description:
                                                                                "Teaser with or w/o additional content flyout. Teaser content can be retrieved from the linked page or edited manually.",
                                                                            id: "teaserRoutingTemplate",
                                                                            validation: [],
                                                                            fields: [
                                                                                {
                                                                                    type: "object",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "object"
                                                                                    },
                                                                                    label: "Title",
                                                                                    fieldId:
                                                                                        "title",
                                                                                    id: "teaserRoutingTitle",
                                                                                    storageId:
                                                                                        "object@teaserRoutingTitle",
                                                                                    settings: {
                                                                                        fields: [
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "enhanced-text-input"
                                                                                                    },
                                                                                                label: "Title",
                                                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                                                fieldId:
                                                                                                    "title",
                                                                                                id: "teaserRoutingTitleTitle",
                                                                                                storageId:
                                                                                                    "text@teaserRoutingTitleTitle",
                                                                                                settings:
                                                                                                    {
                                                                                                        inputField:
                                                                                                            {}
                                                                                                    }
                                                                                            },
                                                                                            {
                                                                                                type: "text",
                                                                                                list: false,
                                                                                                validation:
                                                                                                    [],
                                                                                                predefinedValues:
                                                                                                    {
                                                                                                        enabled: true,
                                                                                                        values: [
                                                                                                            {
                                                                                                                label: "Auto generated",
                                                                                                                value: "auto",
                                                                                                                selected: true
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H2",
                                                                                                                value: "h2"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H3",
                                                                                                                value: "h3"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H4",
                                                                                                                value: "h4"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H5",
                                                                                                                value: "h5"
                                                                                                            },
                                                                                                            {
                                                                                                                label: "H6",
                                                                                                                value: "h6"
                                                                                                            }
                                                                                                        ]
                                                                                                    },
                                                                                                renderer:
                                                                                                    {
                                                                                                        name: "select-box"
                                                                                                    },
                                                                                                label: "Heading Rank",
                                                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                                                fieldId:
                                                                                                    "headingRank",
                                                                                                id: "teaserRoutingTitleHeadingRank",
                                                                                                storageId:
                                                                                                    "text@teaserRoutingTitleHeadingRank"
                                                                                            }
                                                                                        ],
                                                                                        layout: [
                                                                                            [
                                                                                                "teaserRoutingTitleTitle",
                                                                                                "teaserRoutingTitleHeadingRank"
                                                                                            ]
                                                                                        ]
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "FragmentUUID",
                                                                                    help: "The technical ID of this element.",
                                                                                    fieldId: "uuid",
                                                                                    id: "teaserRoutingUuid",
                                                                                    storageId:
                                                                                        "text@teaserRoutingUuid"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "select-box"
                                                                                    },
                                                                                    label: "Layout",
                                                                                    help: "When “with flyout” is selected, a flyout will only appear if in the flyout is in minimum one teaser: if there’s only the flyout title and/or text, it’s not shown due to UX reasons. In this case please use Accordion/Tab element.",
                                                                                    predefinedValues:
                                                                                        {
                                                                                            enabled: true,
                                                                                            values: [
                                                                                                {
                                                                                                    label: "3 teaser per row",
                                                                                                    value: "3-col",
                                                                                                    selected: true
                                                                                                },
                                                                                                {
                                                                                                    label: "3 teaser per row with flyout",
                                                                                                    value: "3-col-flyout"
                                                                                                },
                                                                                                {
                                                                                                    label: "4 teaser per row with flyout",
                                                                                                    value: "4-col-flyout"
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                    fieldId:
                                                                                        "teaserRoutingLayout",
                                                                                    id: "teaserRoutingLayout",
                                                                                    storageId:
                                                                                        "text@teaserRoutingLayout"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "select-box"
                                                                                    },
                                                                                    label: "Variation",
                                                                                    predefinedValues:
                                                                                        {
                                                                                            enabled: true,
                                                                                            values: [
                                                                                                {
                                                                                                    label: "All elements",
                                                                                                    value: "teaser_card",
                                                                                                    selected: true
                                                                                                },
                                                                                                {
                                                                                                    label: "Teaser title and image",
                                                                                                    value: "teaser_card_headline_image"
                                                                                                },
                                                                                                {
                                                                                                    label: "Teaser title and text",
                                                                                                    value: "teaser_card_headline_text"
                                                                                                },
                                                                                                {
                                                                                                    label: "Teaser title only",
                                                                                                    value: "teaser_card_headline"
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                    fieldId:
                                                                                        "teaserRoutingVariation",
                                                                                    id: "teaserRoutingVariation",
                                                                                    storageId:
                                                                                        "text@teaserRoutingVariation"
                                                                                },
                                                                                {
                                                                                    type: "dynamicZone",
                                                                                    renderer: {
                                                                                        name: "dynamicZone"
                                                                                    },
                                                                                    list: true,
                                                                                    settings: {
                                                                                        templates: [
                                                                                            {
                                                                                                name: "Teaser Card",
                                                                                                gqlTypeName:
                                                                                                    "TeaserRoutingCard",
                                                                                                icon: "fas/receipt",
                                                                                                description:
                                                                                                    "Teaser Card for Teaser Routing",
                                                                                                id: "teaserRoutingCardTemplate",
                                                                                                validation:
                                                                                                    [],
                                                                                                fields: [
                                                                                                    {
                                                                                                        type: "object",
                                                                                                        validation:
                                                                                                            [],
                                                                                                        list: false,
                                                                                                        renderer:
                                                                                                            {
                                                                                                                name: "asset-input"
                                                                                                            },
                                                                                                        label: "Media",
                                                                                                        fieldId:
                                                                                                            "teaserRoutingCardMediaMedia",
                                                                                                        id: "teaserRoutingCardMedia",
                                                                                                        storageId:
                                                                                                            "object@teaserRoutingCardMedia",
                                                                                                        settings:
                                                                                                            {
                                                                                                                cropPresets:
                                                                                                                    {
                                                                                                                        single: {
                                                                                                                            presetsList:
                                                                                                                                [
                                                                                                                                    "16:9"
                                                                                                                                ]
                                                                                                                        }
                                                                                                                    },
                                                                                                                fields: [
                                                                                                                    {
                                                                                                                        type: "file",
                                                                                                                        list: false,
                                                                                                                        label: "File",
                                                                                                                        help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                                                                        fieldId:
                                                                                                                            "file",
                                                                                                                        id: "teaserRoutingCardMediaFile",
                                                                                                                        storageId:
                                                                                                                            "file@teaserRoutingCardMediaFile"
                                                                                                                    },
                                                                                                                    {
                                                                                                                        type: "text",
                                                                                                                        list: false,
                                                                                                                        renderer:
                                                                                                                            {
                                                                                                                                name: "text-input"
                                                                                                                            },
                                                                                                                        label: "Alternative text",
                                                                                                                        help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                                                                        fieldId:
                                                                                                                            "altText",
                                                                                                                        id: "teaserRoutingCardMediaAltText",
                                                                                                                        storageId:
                                                                                                                            "text@teaserRoutingCardMediaAltText"
                                                                                                                    },
                                                                                                                    {
                                                                                                                        type: "text",
                                                                                                                        list: false,
                                                                                                                        renderer:
                                                                                                                            {
                                                                                                                                name: "slug-field-input"
                                                                                                                            },
                                                                                                                        label: "SEO name",
                                                                                                                        help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                                                                        fieldId:
                                                                                                                            "seoName",
                                                                                                                        id: "teaserRoutingCardMediaSeoName",
                                                                                                                        storageId:
                                                                                                                            "text@teaserRoutingCardMediaSeoName"
                                                                                                                    },
                                                                                                                    {
                                                                                                                        type: "text",
                                                                                                                        validation:
                                                                                                                            [],
                                                                                                                        renderer:
                                                                                                                            {
                                                                                                                                name: "text-and-copy-input"
                                                                                                                            },
                                                                                                                        label: "Crop values",
                                                                                                                        help: "The value used to crop this media.",
                                                                                                                        fieldId:
                                                                                                                            "crop",
                                                                                                                        id: "teaserRoutingCardMediaCrop",
                                                                                                                        storageId:
                                                                                                                            "text@teaserRoutingCardMediaCrop",
                                                                                                                        settings:
                                                                                                                            {
                                                                                                                                disabled: true
                                                                                                                            }
                                                                                                                    }
                                                                                                                ],
                                                                                                                layout: [
                                                                                                                    [
                                                                                                                        "teaserRoutingCardMediaFile"
                                                                                                                    ],
                                                                                                                    [
                                                                                                                        "teaserRoutingCardMediaAltText"
                                                                                                                    ],
                                                                                                                    [
                                                                                                                        "teaserRoutingCardMediaSeoName"
                                                                                                                    ],
                                                                                                                    [
                                                                                                                        "teaserRoutingCardMediaCrop"
                                                                                                                    ]
                                                                                                                ]
                                                                                                            }
                                                                                                    },
                                                                                                    {
                                                                                                        type: "text",
                                                                                                        validation:
                                                                                                            [],
                                                                                                        renderer:
                                                                                                            {
                                                                                                                name: "select-box"
                                                                                                            },
                                                                                                        label: "Background option",
                                                                                                        predefinedValues:
                                                                                                            {
                                                                                                                enabled: true,
                                                                                                                values: [
                                                                                                                    {
                                                                                                                        label: "Fixed Width",
                                                                                                                        value: "fixed",
                                                                                                                        selected: true
                                                                                                                    },
                                                                                                                    {
                                                                                                                        label: "Transparent Background",
                                                                                                                        value: "transparent"
                                                                                                                    },
                                                                                                                    {
                                                                                                                        label: "White Background",
                                                                                                                        value: "white"
                                                                                                                    }
                                                                                                                ]
                                                                                                            },
                                                                                                        fieldId:
                                                                                                            "backgroundOption",
                                                                                                        id: "teaserRoutingCardBackgroundOption",
                                                                                                        storageId:
                                                                                                            "text@teaserRoutingBackgroundOption"
                                                                                                    },
                                                                                                    {
                                                                                                        type: "text",
                                                                                                        validation:
                                                                                                            [
                                                                                                                {
                                                                                                                    name: "required",
                                                                                                                    message:
                                                                                                                        "Value is required."
                                                                                                                }
                                                                                                            ],
                                                                                                        list: false,
                                                                                                        renderer:
                                                                                                            {
                                                                                                                name: "enhanced-text-input"
                                                                                                            },
                                                                                                        label: "Teaser title",
                                                                                                        help: "If empty, teaser title from relative linked page teaser content will be shown. Max. 70 characters recommended.",
                                                                                                        fieldId:
                                                                                                            "title",
                                                                                                        id: "teaserRoutingCardTitle",
                                                                                                        storageId:
                                                                                                            "text@teaserTitle",
                                                                                                        settings:
                                                                                                            {
                                                                                                                inputField:
                                                                                                                    {
                                                                                                                        rows: 2
                                                                                                                    }
                                                                                                            }
                                                                                                    },
                                                                                                    {
                                                                                                        type: "text",
                                                                                                        list: false,
                                                                                                        renderer:
                                                                                                            {
                                                                                                                name: "enhanced-text-input"
                                                                                                            },
                                                                                                        label: "Text",
                                                                                                        help: "It's recommended to not exceed a length of 150 characters.",
                                                                                                        fieldId:
                                                                                                            "text",
                                                                                                        id: "teaserRoutingCardText",
                                                                                                        storageId:
                                                                                                            "text@teaserText",
                                                                                                        settings:
                                                                                                            {
                                                                                                                inputField:
                                                                                                                    {
                                                                                                                        rows: 5
                                                                                                                    }
                                                                                                            }
                                                                                                    },
                                                                                                    {
                                                                                                        type: "text",
                                                                                                        renderer:
                                                                                                            {
                                                                                                                name: "text-input"
                                                                                                            },
                                                                                                        validation:
                                                                                                            [
                                                                                                                {
                                                                                                                    name: "required",
                                                                                                                    message:
                                                                                                                        "Value is required."
                                                                                                                },
                                                                                                                {
                                                                                                                    name: "pattern",
                                                                                                                    settings:
                                                                                                                        {
                                                                                                                            preset: "url"
                                                                                                                        },
                                                                                                                    message:
                                                                                                                        "URL Format is required"
                                                                                                                }
                                                                                                            ],
                                                                                                        label: "Link",
                                                                                                        fieldId:
                                                                                                            "linkpicker",
                                                                                                        id: "teaserRoutingCardLink",
                                                                                                        help: "If link is SmartCMS internal, create link relative via <Picker> to avoid 404 errors",
                                                                                                        storageId:
                                                                                                            "text@teaserRoutingCardLink"
                                                                                                    },
                                                                                                    {
                                                                                                        type: "text",
                                                                                                        validation:
                                                                                                            [],
                                                                                                        renderer:
                                                                                                            {
                                                                                                                name: "text-input"
                                                                                                            },
                                                                                                        label: "FragmentUUID",
                                                                                                        help: "The technical ID of this element.",
                                                                                                        fieldId:
                                                                                                            "uuid",
                                                                                                        id: "teaserRoutingCardUuid",
                                                                                                        storageId:
                                                                                                            "text@teaserRoutingCardUuid"
                                                                                                    }
                                                                                                ],
                                                                                                layout: [
                                                                                                    [
                                                                                                        "teaserRoutingCardMedia"
                                                                                                    ],
                                                                                                    [
                                                                                                        "teaserRoutingCardBackgroundOption"
                                                                                                    ],
                                                                                                    [
                                                                                                        "teaserRoutingCardTitle"
                                                                                                    ],
                                                                                                    [
                                                                                                        "teaserRoutingCardText"
                                                                                                    ],
                                                                                                    [
                                                                                                        "teaserRoutingCardLink"
                                                                                                    ],
                                                                                                    [
                                                                                                        "teaserRoutingCardUuid"
                                                                                                    ]
                                                                                                ]
                                                                                            }
                                                                                        ]
                                                                                    },
                                                                                    label: "Teaser Card",
                                                                                    help: "Select one or more of the allowed elements or fragments. Be aware the title of the elements isn’t delivered live.",
                                                                                    fieldId:
                                                                                        "teaserRoutingCards",
                                                                                    id: "teaserRoutingCards",
                                                                                    storageId:
                                                                                        "text@teaserRoutingCards"
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "teaserRoutingTitle"
                                                                                ],
                                                                                [
                                                                                    "teaserRoutingLayout",
                                                                                    "teaserRoutingVariation"
                                                                                ],
                                                                                [
                                                                                    "teaserRoutingCards"
                                                                                ],
                                                                                [
                                                                                    "teaserRoutingUuid"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    ]
                                                                },
                                                                label: "Split content",
                                                                help: "Select one or more of the allowed elements or fragments. Be aware the title of the elements isn’t delivered live.",
                                                                fieldId: "splitContent",
                                                                id: "accordionTabSplitContent",
                                                                storageId:
                                                                    "text@accordionTabSplitContent"
                                                            }
                                                        ],
                                                        layout: [
                                                            ["accordionTabSplitTitle"],
                                                            ["accordionTabSplitContent"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "accordionTabUUID",
                                                    storageId: "text@accordionTabUUID"
                                                }
                                            ],
                                            layout: [
                                                ["accordionTabLayout"],
                                                ["accordionTabTitle"],
                                                ["accordionTabSplit"],
                                                ["accordionTabUUID"]
                                            ]
                                        },
                                        {
                                            name: "Content Teaser Row",
                                            gqlTypeName: "ContentTeaserRow",
                                            icon: "fas/table-columns",
                                            description:
                                                "2 to 4 teasers per row with an image or video, rich text and link list or button.",
                                            id: "contentTeaserRowTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    label: "Layout",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "2 in a row",
                                                                value: "2-col",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "3 in a row",
                                                                value: "3-col"
                                                            },
                                                            {
                                                                label: "4 in a row",
                                                                value: "4-col"
                                                            }
                                                        ]
                                                    },
                                                    fieldId: "layout",
                                                    id: "contentTeaserRowLayout",
                                                    storageId: "text@contentTeaserRowLayout"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "contentTeaserRowTitle",
                                                    storageId: "object@contentTeaserRowTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Title is not shown in the frontend Accordion/Tab",
                                                                fieldId: "title",
                                                                id: "contentTeaserRowTitleTitle",
                                                                storageId:
                                                                    "text@contentTeaserRowTitleTitle",
                                                                settings: {
                                                                    inputField: {}
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "contentTeaserRowTitleHeadingRank",
                                                                storageId:
                                                                    "text@contentTeaserRowTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "contentTeaserRowTitleTitle",
                                                                "contentTeaserRowTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Show on all images",
                                                    help: "You can switch off/on the magnifier and/or the download icon, but only for all images - and not for videos",
                                                    fieldId: "showOnAllImages",
                                                    id: "contentTeaserRowShowOnAllImage",
                                                    storageId: "object@contentTeaserShowOnAllImage",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "boolean",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "boolean-input"
                                                                },
                                                                label: "Magnifier",
                                                                fieldId:
                                                                    "contentTeaserRowMagnifier",
                                                                id: "contentTeaserRowMagnifier",
                                                                storageId:
                                                                    "boolean@contentTeaserRowMagnifier"
                                                            },
                                                            {
                                                                type: "boolean",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "boolean-input"
                                                                },
                                                                label: "Download icon",
                                                                fieldId: "contentTeaserRowDownload",
                                                                id: "contentTeaserRowDownload",
                                                                storageId:
                                                                    "boolean@contentTeaserRowDownload"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "contentTeaserRowDownload",
                                                                "contentTeaserRowMagnifier"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "dynamicZone",
                                                    renderer: {
                                                        name: "dynamicZone"
                                                    },
                                                    list: true,
                                                    settings: {
                                                        templates: [
                                                            {
                                                                name: "Teaser Card",
                                                                gqlTypeName: "ContentTeaserRowCard",
                                                                icon: "fas/receipt",
                                                                description:
                                                                    "A teaser card with an image or video, rich text and link list or button.",
                                                                id: "contentTeaserRowCardTemplate",
                                                                validation: [],
                                                                fields: [
                                                                    {
                                                                        type: "object",
                                                                        validation: [],
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "asset-input"
                                                                        },
                                                                        label: "Media",
                                                                        fieldId:
                                                                            "contentTeaserRowMediaMedia",
                                                                        id: "contentTeaserRowMedia",
                                                                        storageId:
                                                                            "object@contentTeaserRowMedia",
                                                                        settings: {
                                                                            cropPresets: {
                                                                                single: {
                                                                                    presetsList: [
                                                                                        "16:9"
                                                                                    ]
                                                                                }
                                                                            },
                                                                            fields: [
                                                                                {
                                                                                    type: "file",
                                                                                    list: false,
                                                                                    label: "File",
                                                                                    help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                                    fieldId: "file",
                                                                                    id: "contentTeaserRowMediaFile",
                                                                                    storageId:
                                                                                        "file@contentTeaserRowMediaFile"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Alternative text",
                                                                                    help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                                    fieldId:
                                                                                        "altText",
                                                                                    id: "contentTeaserRowMediaAltText",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowMediaAltText"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "slug-field-input"
                                                                                    },
                                                                                    label: "SEO name",
                                                                                    help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                                    fieldId:
                                                                                        "seoName",
                                                                                    id: "contentTeaserRowMediaSeoName",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowMediaSeoName"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "text-and-copy-input"
                                                                                    },
                                                                                    label: "Crop values",
                                                                                    help: "The value used to crop this media.",
                                                                                    fieldId: "crop",
                                                                                    id: "contentTeaserRowMediaCrop",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowMediaCrop",
                                                                                    settings: {
                                                                                        disabled: true
                                                                                    }
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "contentTeaserRowMediaFile"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowMediaAltText"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowMediaSeoName"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowMediaCrop"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "object",
                                                                        validation: [],
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "object"
                                                                        },
                                                                        label: "Teaser Title",
                                                                        fieldId: "title",
                                                                        id: "contentTeaserRowTeaserTitle",
                                                                        storageId:
                                                                            "object@contentTeaserRowTeaserTitle",
                                                                        settings: {
                                                                            fields: [
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "enhanced-text-input"
                                                                                    },
                                                                                    label: "Title",
                                                                                    help: "If teaser title and text missing, the teaser will not be delivered.",
                                                                                    fieldId:
                                                                                        "title",
                                                                                    id: "contentTeaserRowTeaserTitleTitle",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowTeaserTitleTitle",
                                                                                    settings: {
                                                                                        inputField:
                                                                                            {}
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    validation: [],
                                                                                    predefinedValues:
                                                                                        {
                                                                                            enabled: true,
                                                                                            values: [
                                                                                                {
                                                                                                    label: "Auto generated",
                                                                                                    value: "auto",
                                                                                                    selected: true
                                                                                                },
                                                                                                {
                                                                                                    label: "H2",
                                                                                                    value: "h2"
                                                                                                },
                                                                                                {
                                                                                                    label: "H3",
                                                                                                    value: "h3"
                                                                                                },
                                                                                                {
                                                                                                    label: "H4",
                                                                                                    value: "h4"
                                                                                                },
                                                                                                {
                                                                                                    label: "H5",
                                                                                                    value: "h5"
                                                                                                },
                                                                                                {
                                                                                                    label: "H6",
                                                                                                    value: "h6"
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                    renderer: {
                                                                                        name: "select-box"
                                                                                    },
                                                                                    label: "Heading Rank",
                                                                                    help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                                    fieldId:
                                                                                        "headingRank",
                                                                                    id: "contentTeaserRowTeaserTitleHeadingRank",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowTeaserTitleHeadingRank"
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "contentTeaserRowTeaserTitleTitle",
                                                                                    "contentTeaserRowTeaserTitleHeadingRank"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "rich-text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "enhanced-lexical-text-input"
                                                                        },
                                                                        label: "Text",
                                                                        help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                                        fieldId: "text",
                                                                        id: "contentTeaserRowRichText",
                                                                        storageId:
                                                                            "rich-text@contentTeaserRowRichText"
                                                                    },
                                                                    {
                                                                        type: "object",
                                                                        validation: [],
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "object"
                                                                        },
                                                                        label: "Button",
                                                                        help: "The button hierarchy and design is pre-defined per component. See the showroom for details.",
                                                                        fieldId: "button",
                                                                        id: "contentTeaserRowButton",
                                                                        storageId:
                                                                            "object@contentTeaserRowButton",
                                                                        settings: {
                                                                            fields: [
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Button Text",
                                                                                    help: "About 30 characters per row, if delivered on desktop. On mobile devices please calculate with ~20.",
                                                                                    fieldId:
                                                                                        "buttonText",
                                                                                    id: "contentTeaserRowButtonText",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowButtonText"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Button Link",
                                                                                    fieldId:
                                                                                        "linkpicker",
                                                                                    id: "contentTeaserRowButtonLink",
                                                                                    help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowButtonLink"
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "contentTeaserRowButtonText",
                                                                                    "contentTeaserRowButtonLink"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "object",
                                                                        validation: [],
                                                                        list: true,
                                                                        renderer: {
                                                                            name: "objects"
                                                                        },
                                                                        label: "LinkList",
                                                                        fieldId: "linklist",
                                                                        id: "contentTeaserRowLinkList",
                                                                        storageId:
                                                                            "object@contentTeaserRowLinkList",
                                                                        settings: {
                                                                            fields: [
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    validation: [
                                                                                        {
                                                                                            name: "required",
                                                                                            message:
                                                                                                "Value is required."
                                                                                        }
                                                                                    ],
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Link Text",
                                                                                    help: "Mandatory. For SEO avoid terms like “More” or “Click here”.",
                                                                                    fieldId: "text",
                                                                                    id: "contentTeaserRowLinkListText",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowLinkListText"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    validation: [
                                                                                        {
                                                                                            name: "required",
                                                                                            message:
                                                                                                "Value is required."
                                                                                        }
                                                                                    ],
                                                                                    label: "Link",
                                                                                    fieldId:
                                                                                        "linkpicker",
                                                                                    id: "contentTeaserRowLinkListLink",
                                                                                    help: "If link is SmartCMS internal, create link relative via <Picker> to avoid 404 errors",
                                                                                    storageId:
                                                                                        "text@contentTeaserRowLinkListLink"
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "contentTeaserRowLinkListText"
                                                                                ],
                                                                                [
                                                                                    "contentTeaserRowLinkListLink"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "text-input"
                                                                        },
                                                                        label: "FragmentUUID",
                                                                        help: "The technical ID of this element.",
                                                                        fieldId: "uuid",
                                                                        id: "contentTeaserRowUuid",
                                                                        storageId:
                                                                            "text@contentTeaserRowUuid"
                                                                    }
                                                                ],
                                                                layout: [
                                                                    ["contentTeaserRowMedia"],
                                                                    ["contentTeaserRowTeaserTitle"],
                                                                    ["contentTeaserRowRichText"],
                                                                    ["contentTeaserRowButton"],
                                                                    ["contentTeaserRowLinkList"],
                                                                    ["contentTeaserRowUuid"]
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    label: "Cards content",
                                                    help: "Select one or more of the allowed elements or fragments. Be aware the title of the elements isn’t delivered live.",
                                                    fieldId: "contentTeaserRowCards",
                                                    id: "contentTeaserRowCards",
                                                    storageId: "text@contentTeaserRowCards"
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "contentTeaserRowUuid",
                                                    storageId: "text@contentTeaserRowUuid"
                                                }
                                            ],
                                            layout: [
                                                ["contentTeaserRowTitle"],
                                                ["contentTeaserRowLayout"],
                                                ["contentTeaserRowShowOnAllImage"],
                                                ["contentTeaserRowCards"],
                                                ["contentTeaserRowUuid"]
                                            ]
                                        },
                                        {
                                            name: "Gallery",
                                            gqlTypeName: "Gallery",
                                            icon: "fas/file-video",
                                            description:
                                                "Image a/o video slider which fills the complete browser width. Linked caption optional.",
                                            id: "galleryTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "galleryTitle",
                                                    storageId: "object@galleryTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                fieldId: "title",
                                                                id: "galleryTitleTitle",
                                                                storageId: "text@galleryTitleTitle",
                                                                settings: {
                                                                    inputField: {}
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "galleryTitleHeadingRank",
                                                                storageId:
                                                                    "text@galleryTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "galleryTitleTitle",
                                                                "galleryTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Show on all images",
                                                    help: "You can switch off/on the magnifier and/or the download icon, but only for all images - and not for videos",
                                                    fieldId: "showOnAllImages",
                                                    id: "galleryShowOnAllImage",
                                                    storageId: "object@galleryShowOnAllImage",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "boolean",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "boolean-input"
                                                                },
                                                                label: "Magnifier",
                                                                fieldId: "galleryMagnifier",
                                                                id: "galleryMagnifier",
                                                                storageId: "text@galleryMagnifier"
                                                            },
                                                            {
                                                                type: "boolean",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "boolean-input"
                                                                },
                                                                label: "Download icon",
                                                                fieldId: "galleryDownloadIcon",
                                                                id: "galleryDownloadIcon",
                                                                storageId:
                                                                    "text@galleryDownloadIcon"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "galleryMagnifier",
                                                                "galleryDownloadIcon"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: true,
                                                    renderer: {
                                                        name: "asset-input"
                                                    },
                                                    label: "Media",
                                                    help: "The ratio is free for single images. For multiple images the ratio is fixed at 16:9.",
                                                    fieldId: "galleryMedia",
                                                    id: "galleryMedia",
                                                    storageId: "object@galleryMedia",
                                                    settings: {
                                                        contentType: ["IMAGES", "VIDEOS"],
                                                        cropPresets: {
                                                            single: {
                                                                presetsList: ["EMPTY"]
                                                            },
                                                            multiple: {
                                                                presetsList: ["16:9"]
                                                            }
                                                        },
                                                        fields: [
                                                            {
                                                                type: "file",
                                                                list: false,
                                                                label: "File",
                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                fieldId: "file",
                                                                id: "galleryMediaFile",
                                                                storageId: "file@galleryMediaFile"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Alternative text",
                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                fieldId: "altText",
                                                                id: "galleryMediaAltText",
                                                                storageId:
                                                                    "text@galleryMediaAltText"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "slug-field-input"
                                                                },
                                                                label: "SEO name",
                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                fieldId: "seoName",
                                                                id: "galleryMediaSeoName",
                                                                storageId:
                                                                    "text@galleryMediaSeoName"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Caption",
                                                                help: "Text length is max. 300 characters incl. spaces.",
                                                                fieldId: "caption",
                                                                id: "galleryMediaCaption",
                                                                storageId:
                                                                    "text@galleryMediaCaption",
                                                                validation: [
                                                                    {
                                                                        name: "maxLength",
                                                                        message:
                                                                            "Caption is longer then 300 characters.",
                                                                        settings: {
                                                                            value: 300
                                                                        }
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Caption link",
                                                                help: "The link affects the complete text, not single words.",
                                                                fieldId: "captionLink",
                                                                id: "galleryMediaCaptionLink",
                                                                storageId:
                                                                    "text@galleryMediaCaptionLink"
                                                            },
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "text-and-copy-input"
                                                                },
                                                                label: "Crop values",
                                                                help: "The value used to crop this media.",
                                                                fieldId: "crop",
                                                                id: "galleryMediaCrop",
                                                                storageId: "text@galleryMediaCrop",
                                                                settings: {
                                                                    disabled: true
                                                                }
                                                            }
                                                        ],
                                                        layout: [
                                                            ["galleryMediaFile"],
                                                            ["galleryMediaAltText"],
                                                            ["galleryMediaSeoName"],
                                                            ["galleryMediaCaption"],
                                                            ["galleryMediaCaptionLink"],
                                                            ["galleryMediaCrop"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "galleryUuid",
                                                    storageId: "text@galleryUuid"
                                                }
                                            ],
                                            layout: [
                                                ["galleryTitle"],
                                                ["galleryShowOnAllImage"],
                                                ["galleryMedia"],
                                                ["galleryUuid"]
                                            ]
                                        },
                                        {
                                            name: "Media Rich Text",
                                            gqlTypeName: "MediaRichText",
                                            icon: "fas/align-left",
                                            description:
                                                "Media Rich Text Component : Text and image a/o video side-by-side. Enrich-able with title, subtitle link list or button.",
                                            id: "mediaRichtextTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "text",
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    help: "If single image, the ratio is free. For more than one it is set to 16:9.",
                                                    label: "Layout",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "Media position left",
                                                                value: "imageLeft",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "Media position right",
                                                                value: "imageRight"
                                                            }
                                                        ]
                                                    },
                                                    fieldId: "layout",
                                                    id: "mrtLayout",
                                                    storageId: "text@mrtLayout"
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "mrtUuid",
                                                    storageId: "text@mrtUuid"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "mrtTitle",
                                                    storageId: "object@mrtTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                fieldId: "title",
                                                                id: "mrtTitleTitle",
                                                                storageId: "text@mrtTitleTitle",
                                                                settings: {
                                                                    inputField: {}
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "mrtTitleHeadingRank",
                                                                storageId:
                                                                    "text@mrtTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            ["mrtTitleTitle", "mrtTitleHeadingRank"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "Subtitle",
                                                    help: "Plain text, max 150 characters.",
                                                    fieldId: "subtitle",
                                                    id: "mrtSubtitle",
                                                    storageId: "text@mrtSubtitle"
                                                },
                                                {
                                                    type: "rich-text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "enhanced-lexical-text-input"
                                                    },
                                                    label: "Text",
                                                    help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                    fieldId: "text",
                                                    id: "mrtRichText",
                                                    storageId: "rich-text@mrtRichText"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: true,
                                                    renderer: {
                                                        name: "asset-input"
                                                    },
                                                    label: "Media",
                                                    help: "The ratio is free for single images. For multiple images the ratio is fixed at 16:9.",
                                                    fieldId: "mrtMedia",
                                                    id: "mrtMedia",
                                                    storageId: "object@mrtMedia",
                                                    settings: {
                                                        cropPresets: {
                                                            single: {
                                                                presetsList: ["EMPTY"]
                                                            },
                                                            multiple: {
                                                                presetsList: ["16:9"]
                                                            }
                                                        },
                                                        fields: [
                                                            {
                                                                type: "file",
                                                                list: false,
                                                                label: "File",
                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                fieldId: "file",
                                                                id: "mrtMediaFile",
                                                                storageId: "file@mrtMediaFile"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Alternative text",
                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                fieldId: "altText",
                                                                id: "mrtMediaAltText",
                                                                storageId: "text@mrtMediaAltText"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "slug-field-input"
                                                                },
                                                                label: "SEO name",
                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                fieldId: "seoName",
                                                                id: "mrtMediaSeoName",
                                                                storageId: "text@mrtMediaSeoName"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Caption",
                                                                help: "Text length is max. 300 characters incl. spaces.",
                                                                fieldId: "caption",
                                                                id: "mrtMediaCaption",
                                                                storageId: "text@mrtMediaCaption",
                                                                validation: [
                                                                    {
                                                                        name: "maxLength",
                                                                        message:
                                                                            "Caption is longer then 300 characters.",
                                                                        settings: {
                                                                            value: 300
                                                                        }
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Caption link",
                                                                help: "The link affects the complete text, not single words.",
                                                                fieldId: "captionLink",
                                                                id: "mrtMediaCaptionLink",
                                                                storageId:
                                                                    "text@mrtMediaCaptionLink"
                                                            },
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "text-and-copy-input"
                                                                },
                                                                label: "Crop values",
                                                                help: "The value used to crop this media.",
                                                                fieldId: "crop",
                                                                id: "mrtMediaCrop",
                                                                storageId: "text@mrtMediaCrop",
                                                                settings: {
                                                                    disabled: true
                                                                }
                                                            }
                                                        ],
                                                        layout: [
                                                            ["mrtMediaFile"],
                                                            ["mrtMediaAltText"],
                                                            ["mrtMediaSeoName"],
                                                            ["mrtMediaCaption"],
                                                            ["mrtMediaCaptionLink"],
                                                            ["mrtMediaCrop"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Button",
                                                    help: "The button hierarchy and design is pre-defined per component. See the showroom for details.",
                                                    fieldId: "button",
                                                    id: "mrtButton",
                                                    storageId: "object@mrtButton",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Button Text",
                                                                help: "About 30 characters per row, if delivered on desktop. On mobile devices please calculate with ~20.",
                                                                fieldId: "buttonText",
                                                                id: "mrtButtonText",
                                                                storageId: "text@mrtButtonText"
                                                            },
                                                            {
                                                                type: "text",
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Button Link",
                                                                fieldId: "linkpicker",
                                                                id: "mrtButtonLink",
                                                                help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                                storageId: "text@mrtButtonLink"
                                                            }
                                                        ],
                                                        layout: [["mrtButtonText", "mrtButtonLink"]]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: true,
                                                    renderer: {
                                                        name: "objects"
                                                    },
                                                    label: "LinkList",
                                                    fieldId: "linklist",
                                                    id: "mrtLinkList",
                                                    storageId: "object@mrtLinkList",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [
                                                                    {
                                                                        name: "required",
                                                                        message:
                                                                            "Value is required."
                                                                    }
                                                                ],
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Link Text",
                                                                help: "Mandatory. For SEO avoid terms like “More” or “Click here”.",
                                                                fieldId: "text",
                                                                id: "mrtLinkListText",
                                                                storageId: "text@mrtLinkListText"
                                                            },
                                                            {
                                                                type: "text",
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                validation: [
                                                                    {
                                                                        name: "required",
                                                                        message:
                                                                            "Value is required."
                                                                    }
                                                                ],
                                                                label: "Link",
                                                                fieldId: "linkpicker",
                                                                id: "mrtLinkListLink",
                                                                help: "If link is SmartCMS internal, create link relative via <Picker> to avoid 404 errors",
                                                                storageId: "text@mrtLinkListLink"
                                                            }
                                                        ],
                                                        layout: [
                                                            ["mrtLinkListText"],
                                                            ["mrtLinkListLink"]
                                                        ]
                                                    }
                                                }
                                            ],
                                            layout: [
                                                ["mrtLayout"],
                                                ["mrtTitle"],
                                                ["mrtSubtitle"],
                                                ["mrtRichText"],
                                                ["mrtMedia"],
                                                ["mrtButton"],
                                                ["mrtLinkList"],
                                                ["mrtUuid"]
                                            ]
                                        },
                                        {
                                            name: "Quote",
                                            gqlTypeName: "Quote",
                                            icon: "fas/quote-right",
                                            description: "Quote with source and optional image.",
                                            id: "quoteTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "quoteTitle",
                                                    storageId: "object@quoteTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                fieldId: "title",
                                                                id: "quoteTitleTitle",
                                                                storageId: "text@quoteTitleTitle",
                                                                settings: {
                                                                    inputField: {}
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "quoteTitleHeadingRank",
                                                                storageId:
                                                                    "text@quoteTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "quoteTitleTitle",
                                                                "quoteTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    label: "Layout",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "Image position left",
                                                                value: "imageLeft",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "Image position right",
                                                                value: "imageRight"
                                                            }
                                                        ]
                                                    },
                                                    settings: {
                                                        defaultValue: "imageLeft"
                                                    },
                                                    fieldId: "layout",
                                                    id: "quoteLayout",
                                                    storageId: "text@quoteLayout"
                                                },
                                                {
                                                    type: "text",
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    label: "Focus On",
                                                    help: "Which one should be in user’s focus: the image or the quote?",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "Quote",
                                                                value: "quote",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "Image",
                                                                value: "image"
                                                            }
                                                        ]
                                                    },
                                                    settings: {
                                                        defaultValue: "quote"
                                                    },
                                                    fieldId: "focusOn",
                                                    id: "quoteFocusOn",
                                                    storageId: "text@quoteFocusOn"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "asset-input"
                                                    },
                                                    label: "Media",
                                                    fieldId: "quoteMedia",
                                                    id: "quoteMedia",
                                                    storageId: "object@quoteMedia",
                                                    settings: {
                                                        contentType: ["GIFS", "IMAGES"],
                                                        fields: [
                                                            {
                                                                type: "file",
                                                                list: false,
                                                                label: "File",
                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                fieldId: "file",
                                                                id: "quoteMediaFile",
                                                                storageId: "file@quoteMediaFile"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Alternative text",
                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                fieldId: "altText",
                                                                id: "quoteMediaAltText",
                                                                storageId: "text@quoteMediaAltText"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "slug-field-input"
                                                                },
                                                                label: "SEO name",
                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                fieldId: "seoName",
                                                                id: "quoteMediaSeoName",
                                                                storageId: "text@quoteMediaSeoName"
                                                            },
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "text-and-copy-input"
                                                                },
                                                                label: "Crop values",
                                                                help: "The value used to crop this media.",
                                                                fieldId: "crop",
                                                                id: "quoteMediaCrop",
                                                                storageId: "text@quoteMediaCrop",
                                                                settings: {
                                                                    disabled: true
                                                                }
                                                            }
                                                        ],
                                                        layout: [
                                                            ["quoteMediaFile"],
                                                            ["quoteMediaAltText"],
                                                            ["quoteMediaSeoName"],
                                                            ["quoteMediaCrop"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    validation: [
                                                        {
                                                            name: "required",
                                                            message: "Value is required."
                                                        }
                                                    ],
                                                    renderer: {
                                                        name: "enhanced-text-input"
                                                    },
                                                    help: "The recommended length is 160 characters, as longer quotes are often not read by users.",
                                                    label: "Quote",
                                                    fieldId: "quoteText",
                                                    id: "quoteText",
                                                    storageId: "text@quotetext",
                                                    settings: {
                                                        inputField: {
                                                            rows: 5
                                                        }
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    renderer: {
                                                        name: "enhanced-text-input"
                                                    },
                                                    help: "It's recommended to not exceed a length of 160 characters.",
                                                    label: "Source",
                                                    fieldId: "quoteSource",
                                                    id: "quoteSource",
                                                    storageId: "text@quotesource",
                                                    settings: {
                                                        inputField: {
                                                            rows: 5
                                                        }
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "quoteUuid",
                                                    storageId: "text@quoteUuid"
                                                }
                                            ],
                                            layout: [
                                                ["quoteTitle"],
                                                ["quoteLayout", "quoteFocusOn"],
                                                ["quoteMedia"],
                                                ["quoteText", "quoteSource"],
                                                ["quoteUuid"]
                                            ]
                                        },
                                        {
                                            name: "Reference Slider",
                                            gqlTypeName: "ReferenceSlider",
                                            icon: "fas/receipt",
                                            description:
                                                "Up to 9 teasers in a row with an individual tag line, title, rich text in a maximum of 3 bullet points and a link button.",
                                            id: "referenceSliderTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "referenceSliderTitle",
                                                    storageId: "object@referenceSliderTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                fieldId: "title",
                                                                id: "referenceSliderTitleTitle",
                                                                storageId:
                                                                    "text@referenceSliderTitleTitle",
                                                                settings: {
                                                                    inputField: {}
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "referenceSliderTitleHeadingRank",
                                                                storageId:
                                                                    "text@referenceSliderTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "referenceSliderTitleTitle",
                                                                "referenceSliderTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "dynamicZone",
                                                    renderer: {
                                                        name: "dynamicZone"
                                                    },
                                                    list: true,
                                                    settings: {
                                                        templates: [
                                                            {
                                                                name: "Reference Slider Card",
                                                                gqlTypeName: "ReferenceSliderCard",
                                                                icon: "fas/receipt",
                                                                description:
                                                                    "It is recommended to use up to 3 cards per slider element.The ratio of the media elements is fixed at 16:9.",
                                                                id: "referenceSliderCardTemplate",
                                                                validation: [],
                                                                fields: [
                                                                    {
                                                                        type: "object",
                                                                        validation: [
                                                                            {
                                                                                name: "required",
                                                                                message:
                                                                                    "Must select a media"
                                                                            }
                                                                        ],
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "asset-input"
                                                                        },
                                                                        label: "Media",
                                                                        fieldId:
                                                                            "referenceSliderCardMedia",
                                                                        id: "referenceSliderCardMedia",
                                                                        storageId:
                                                                            "object@referenceSliderCardMedia",
                                                                        settings: {
                                                                            cropPresets: {
                                                                                single: {
                                                                                    automatic: true,
                                                                                    defaultPreset:
                                                                                        "16:9",
                                                                                    presetsList: [
                                                                                        "16:9"
                                                                                    ]
                                                                                }
                                                                            },
                                                                            fields: [
                                                                                {
                                                                                    type: "file",
                                                                                    list: false,
                                                                                    label: "File",
                                                                                    help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                                    fieldId: "file",
                                                                                    id: "referenceSliderCardMediaFile",
                                                                                    storageId:
                                                                                        "file@referenceSliderCardMediaFile"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Alternative text",
                                                                                    help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                                    fieldId:
                                                                                        "altText",
                                                                                    id: "referenceSliderCardMediaAltText",
                                                                                    storageId:
                                                                                        "text@referenceSliderCardMediaAltText"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "slug-field-input"
                                                                                    },
                                                                                    label: "SEO name",
                                                                                    help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                                    fieldId:
                                                                                        "seoName",
                                                                                    id: "referenceSliderCardMediaSeoName",
                                                                                    storageId:
                                                                                        "text@referenceSliderCardMediaSeoName"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "text-and-copy-input"
                                                                                    },
                                                                                    label: "Crop values",
                                                                                    help: "The value used to crop this media.",
                                                                                    fieldId: "crop",
                                                                                    id: "referenceSliderCardMediaCrop",
                                                                                    storageId:
                                                                                        "text@referenceSliderCardMediaCrop",
                                                                                    settings: {
                                                                                        disabled: true
                                                                                    }
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "referenceSliderCardMediaFile"
                                                                                ],
                                                                                [
                                                                                    "referenceSliderCardMediaAltText"
                                                                                ],
                                                                                [
                                                                                    "referenceSliderCardMediaSeoName"
                                                                                ],
                                                                                [
                                                                                    "referenceSliderCardMediaCrop"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "text-input"
                                                                        },
                                                                        label: "Customer name",
                                                                        help: "Appears like a Tag above the headline, optional",
                                                                        fieldId:
                                                                            "referenceSliderCardCustomerName",
                                                                        id: "referenceSliderCardCustomerName",
                                                                        storageId:
                                                                            "text@referenceSliderCardCustomerName"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "text-input"
                                                                        },
                                                                        label: "Location",
                                                                        help: "Appears like a Tag above the headline, optional",
                                                                        fieldId:
                                                                            "referenceSliderCardLocation",
                                                                        id: "referenceSliderCardLocation",
                                                                        storageId:
                                                                            "text@referenceSliderCardLocation"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "text-input"
                                                                        },
                                                                        label: "Market",
                                                                        help: "Appears like a Tag above the headline, optional",
                                                                        fieldId:
                                                                            "referenceSliderCardMarket",
                                                                        id: "referenceSliderCardMarket",
                                                                        storageId:
                                                                            "text@referenceSliderCardMarket"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "enhanced-text-input"
                                                                        },
                                                                        label: "Title",
                                                                        help: "Mandatory, max. 70 characters recommended",
                                                                        fieldId:
                                                                            "referenceSliderCardTitle",
                                                                        id: "referenceSliderCardTitle",
                                                                        storageId:
                                                                            "text@referenceSliderCardTitle",
                                                                        validation: [
                                                                            {
                                                                                name: "required",
                                                                                message:
                                                                                    "The field is required"
                                                                            }
                                                                        ],
                                                                        settings: {
                                                                            inputField: {
                                                                                rows: 2
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "rich-text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "enhanced-lexical-text-input"
                                                                        },
                                                                        label: "Bullet point 1",
                                                                        help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                                        fieldId:
                                                                            "referenceSliderCardBulletPoint1",
                                                                        placeholder:
                                                                            "Max. 140 characters recommended, optional",
                                                                        id: "referenceSliderCardBulletPoint1",
                                                                        storageId:
                                                                            "rich-text@referenceSliderCardBulletPoint1"
                                                                    },
                                                                    {
                                                                        type: "rich-text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "enhanced-lexical-text-input"
                                                                        },
                                                                        label: "Bullet point 2",
                                                                        help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                                        fieldId:
                                                                            "referenceSliderCardBulletPoint2",
                                                                        placeholder:
                                                                            "Max. 140 characters recommended, optional",
                                                                        id: "referenceSliderCardBulletPoint2",
                                                                        storageId:
                                                                            "rich-text@referenceSliderCardBulletPoint2"
                                                                    },
                                                                    {
                                                                        type: "rich-text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "enhanced-lexical-text-input"
                                                                        },
                                                                        label: "Bullet point 3",
                                                                        help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                                        fieldId:
                                                                            "referenceSliderCardBulletPoint3",
                                                                        placeholder:
                                                                            "Max. 140 characters recommended, optional",
                                                                        id: "referenceSliderCardBulletPoint3",
                                                                        storageId:
                                                                            "rich-text@referenceSliderCardBulletPoint3"
                                                                    },
                                                                    {
                                                                        type: "object",
                                                                        validation: [],
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "object"
                                                                        },
                                                                        label: "Button",
                                                                        help: "The button hierarchy and design is pre-defined per component. See the showroom for details.",
                                                                        fieldId: "button",
                                                                        id: "referenceSliderCardButton",
                                                                        storageId:
                                                                            "object@referenceSliderCardButton",
                                                                        settings: {
                                                                            fields: [
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Button Text",
                                                                                    help: "About 30 characters per row, if delivered on desktop. On mobile devices please calculate with ~20.",
                                                                                    fieldId:
                                                                                        "buttonText",
                                                                                    id: "referenceSliderCardButtonText",
                                                                                    storageId:
                                                                                        "text@referenceSliderCardButtonText"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Button Link",
                                                                                    fieldId:
                                                                                        "linkpicker",
                                                                                    id: "referenceSliderCardButtonLink",
                                                                                    help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                                                    storageId:
                                                                                        "text@referenceSliderCardButtonLink"
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "referenceSliderCardButtonText",
                                                                                    "referenceSliderCardButtonLink"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "text-input"
                                                                        },
                                                                        label: "FragmentUUID",
                                                                        help: "The technical ID of this element.",
                                                                        fieldId: "uuid",
                                                                        id: "referenceSliderCardUuid",
                                                                        storageId:
                                                                            "text@referenceSliderCardUuid"
                                                                    }
                                                                ],
                                                                layout: [
                                                                    ["referenceSliderCardMedia"],
                                                                    [
                                                                        "referenceSliderCardCustomerName"
                                                                    ],
                                                                    ["referenceSliderCardLocation"],
                                                                    ["referenceSliderCardMarket"],
                                                                    ["referenceSliderCardTitle"],
                                                                    [
                                                                        "referenceSliderCardBulletPoint1"
                                                                    ],
                                                                    [
                                                                        "referenceSliderCardBulletPoint2"
                                                                    ],
                                                                    [
                                                                        "referenceSliderCardBulletPoint3"
                                                                    ],
                                                                    ["referenceSliderCardButton"],
                                                                    ["referenceSliderCardUuid"]
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    label: "Cards content",
                                                    help: "Select one or more of the allowed elements or fragments. Be aware the title of the elements isn’t delivered live.",
                                                    fieldId: "referenceSliderCards",
                                                    id: "referenceSliderCards",
                                                    storageId: "text@referenceSliderCards"
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "referenceSliderUuid",
                                                    storageId: "text@referenceSliderUuid"
                                                }
                                            ],
                                            layout: [
                                                ["referenceSliderTitle"],
                                                ["referenceSliderCards"],
                                                ["referenceSliderUuid"]
                                            ]
                                        },
                                        {
                                            name: "Stage",
                                            gqlTypeName: "Stage",
                                            icon: "fas/masks-theater",
                                            description:
                                                "1st element of every page, delivers a H1 and a short intro text.",
                                            id: "stageTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    help: "If used outside of Intro section the headline will be delivered as H2.",
                                                    label: "Layout",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "Text only",
                                                                value: "textOnly"
                                                            },
                                                            {
                                                                label: "Text with media left",
                                                                value: "imageLeft"
                                                            },
                                                            {
                                                                label: "Text with media right",
                                                                value: "imageRight",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "Panorama",
                                                                value: "panoramaImage"
                                                            },
                                                            {
                                                                label: "Full screen with background image",
                                                                value: "backgroundImageVideo"
                                                            }
                                                        ]
                                                    },
                                                    fieldId: "layout",
                                                    id: "stageLayout",
                                                    storageId: "text@stageLayout"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "stageTitle",
                                                    storageId: "object@stageTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                validation: [
                                                                    {
                                                                        name: "required",
                                                                        message:
                                                                            "Title is required."
                                                                    }
                                                                ],
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Max. 70 characters incl. spaces are allowed. If you selected layout “Text only”: unlimited.",
                                                                fieldId: "title",
                                                                id: "stageTitleTitle",
                                                                storageId: "text@stageTitleTitle",
                                                                settings: {
                                                                    inputField: {
                                                                        rows: 2
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "stageTitleHeadingRank",
                                                                storageId:
                                                                    "text@stageTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "stageTitleTitle",
                                                                "stageTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "rich-text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "enhanced-lexical-text-input"
                                                    },
                                                    label: "Text",
                                                    help: "For a good user experience it is recommended not to use more than 600 characters incl. spaces. If there is the need for more, it is recommended to split the content into separate elements.",
                                                    fieldId: "stageText",
                                                    placeholder:
                                                        "Max. 400 characters incl. spaces are allowed. If you selected the “Text only”: unlimited.",
                                                    id: "stageText",
                                                    storageId: "rich-text@stageText"
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Button",
                                                    help: "The button hierarchy and design is pre-defined per component. See the showroom for details.",
                                                    fieldId: "button",
                                                    id: "stageButton",
                                                    storageId: "object@stageButton",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Button Text",
                                                                help: "About 30 characters per row, if delivered on desktop. On mobile devices please calculate with ~20.",
                                                                fieldId: "buttonText",
                                                                id: "stageButtonText",
                                                                storageId: "text@stageButtonText"
                                                            },
                                                            {
                                                                type: "text",
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Button Link",
                                                                fieldId: "linkpicker",
                                                                id: "stageButtonLink",
                                                                help: "If link target is SmartCMS internal, create link relative via <Picker> to avoid 404 errors.",
                                                                storageId: "text@stageButtonLink"
                                                            }
                                                        ],
                                                        layout: [
                                                            ["stageButtonText", "stageButtonLink"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "asset-input"
                                                    },
                                                    label: "Media",
                                                    help: "Image 16:9 or 4:3, video always 16:9. Gifs bigger that 6 MB might not be delivered for performance reasons.",
                                                    fieldId: "stageMedia",
                                                    id: "stageMedia",
                                                    storageId: "object@stageMedia",
                                                    settings: {
                                                        cropPresets: {
                                                            single: {
                                                                automatic: true,
                                                                defaultPreset: "4:3",
                                                                presetsList: ["4:3", "16:9"]
                                                            }
                                                        },
                                                        fields: [
                                                            {
                                                                type: "file",
                                                                list: false,
                                                                label: "File",
                                                                help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                fieldId: "file",
                                                                id: "stageMediaFile",
                                                                storageId: "file@stageMediaFile"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "text-input"
                                                                },
                                                                label: "Alternative text",
                                                                help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                fieldId: "altText",
                                                                id: "stageMediaAltText",
                                                                storageId: "text@stageMediaAltText"
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "slug-field-input"
                                                                },
                                                                label: "SEO name",
                                                                help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                fieldId: "seoName",
                                                                id: "stageMediaSeoName",
                                                                storageId: "text@stageMediaSeoName"
                                                            },
                                                            {
                                                                type: "text",
                                                                validation: [],
                                                                renderer: {
                                                                    name: "text-and-copy-input"
                                                                },
                                                                label: "Crop values",
                                                                help: "The value used to crop this media.",
                                                                fieldId: "crop",
                                                                id: "stageMediaCrop",
                                                                storageId: "text@stageMediaCrop",
                                                                settings: {
                                                                    disabled: true
                                                                }
                                                            }
                                                        ],
                                                        layout: [
                                                            ["stageMediaFile"],
                                                            ["stageMediaAltText"],
                                                            ["stageMediaSeoName"],
                                                            ["stageMediaCrop"]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "stageUuid",
                                                    storageId: "text@stageUuid"
                                                }
                                            ],
                                            layout: [
                                                ["stageLayout"],
                                                ["stageTitle"],
                                                ["stageText"],
                                                ["stageMedia"],
                                                ["stageButton"],
                                                ["stageUuid"]
                                            ]
                                        },
                                        {
                                            name: "Teaser Routing",
                                            gqlTypeName: "TeaserRouting",
                                            icon: "fas/table-columns",
                                            description:
                                                "Teaser with or w/o additional content flyout. Teaser content can be retrieved from the linked page or edited manually.",
                                            id: "teaserRoutingTemplate",
                                            validation: [],
                                            fields: [
                                                {
                                                    type: "object",
                                                    validation: [],
                                                    list: false,
                                                    renderer: {
                                                        name: "object"
                                                    },
                                                    label: "Title",
                                                    fieldId: "title",
                                                    id: "teaserRoutingTitle",
                                                    storageId: "object@teaserRoutingTitle",
                                                    settings: {
                                                        fields: [
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                renderer: {
                                                                    name: "enhanced-text-input"
                                                                },
                                                                label: "Title",
                                                                help: "Titles aren’t delivered in Accordion/Tab components for UX reasons.",
                                                                fieldId: "title",
                                                                id: "teaserRoutingTitleTitle",
                                                                storageId:
                                                                    "text@teaserRoutingTitleTitle",
                                                                settings: {
                                                                    inputField: {}
                                                                }
                                                            },
                                                            {
                                                                type: "text",
                                                                list: false,
                                                                validation: [],
                                                                predefinedValues: {
                                                                    enabled: true,
                                                                    values: [
                                                                        {
                                                                            label: "Auto generated",
                                                                            value: "auto",
                                                                            selected: true
                                                                        },
                                                                        {
                                                                            label: "H2",
                                                                            value: "h2"
                                                                        },
                                                                        {
                                                                            label: "H3",
                                                                            value: "h3"
                                                                        },
                                                                        {
                                                                            label: "H4",
                                                                            value: "h4"
                                                                        },
                                                                        {
                                                                            label: "H5",
                                                                            value: "h5"
                                                                        },
                                                                        {
                                                                            label: "H6",
                                                                            value: "h6"
                                                                        }
                                                                    ]
                                                                },
                                                                renderer: {
                                                                    name: "select-box"
                                                                },
                                                                label: "Heading Rank",
                                                                help: "The heading rank is a page structure element needed for SEO, calculated by SmartCMS. To change the structure of the page you can choose another rank, following subtitles will be recalculated automatically.",
                                                                fieldId: "headingRank",
                                                                id: "teaserRoutingTitleHeadingRank",
                                                                storageId:
                                                                    "text@teaserRoutingTitleHeadingRank"
                                                            }
                                                        ],
                                                        layout: [
                                                            [
                                                                "teaserRoutingTitleTitle",
                                                                "teaserRoutingTitleHeadingRank"
                                                            ]
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "text-input"
                                                    },
                                                    label: "FragmentUUID",
                                                    help: "The technical ID of this element.",
                                                    fieldId: "uuid",
                                                    id: "teaserRoutingUuid",
                                                    storageId: "text@teaserRoutingUuid"
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    label: "Layout",
                                                    help: "When “with flyout” is selected, a flyout will only appear if in the flyout is in minimum one teaser: if there’s only the flyout title and/or text, it’s not shown due to UX reasons. In this case please use Accordion/Tab element.",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "3 teaser per row",
                                                                value: "3-col",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "3 teaser per row with flyout",
                                                                value: "3-col-flyout"
                                                            },
                                                            {
                                                                label: "4 teaser per row with flyout",
                                                                value: "4-col-flyout"
                                                            }
                                                        ]
                                                    },
                                                    fieldId: "teaserRoutingLayout",
                                                    id: "teaserRoutingLayout",
                                                    storageId: "text@teaserRoutingLayout"
                                                },
                                                {
                                                    type: "text",
                                                    validation: [],
                                                    renderer: {
                                                        name: "select-box"
                                                    },
                                                    label: "Variation",
                                                    predefinedValues: {
                                                        enabled: true,
                                                        values: [
                                                            {
                                                                label: "All elements",
                                                                value: "teaser_card",
                                                                selected: true
                                                            },
                                                            {
                                                                label: "Teaser title and image",
                                                                value: "teaser_card_headline_image"
                                                            },
                                                            {
                                                                label: "Teaser title and text",
                                                                value: "teaser_card_headline_text"
                                                            },
                                                            {
                                                                label: "Teaser title only",
                                                                value: "teaser_card_headline"
                                                            }
                                                        ]
                                                    },
                                                    fieldId: "teaserRoutingVariation",
                                                    id: "teaserRoutingVariation",
                                                    storageId: "text@teaserRoutingVariation"
                                                },
                                                {
                                                    type: "dynamicZone",
                                                    renderer: {
                                                        name: "dynamicZone"
                                                    },
                                                    list: true,
                                                    settings: {
                                                        templates: [
                                                            {
                                                                name: "Teaser Card",
                                                                gqlTypeName: "TeaserRoutingCard",
                                                                icon: "fas/receipt",
                                                                description:
                                                                    "Teaser Card for Teaser Routing",
                                                                id: "teaserRoutingCardTemplate",
                                                                validation: [],
                                                                fields: [
                                                                    {
                                                                        type: "object",
                                                                        validation: [],
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "asset-input"
                                                                        },
                                                                        label: "Media",
                                                                        fieldId:
                                                                            "teaserRoutingCardMediaMedia",
                                                                        id: "teaserRoutingCardMedia",
                                                                        storageId:
                                                                            "object@teaserRoutingCardMedia",
                                                                        settings: {
                                                                            cropPresets: {
                                                                                single: {
                                                                                    presetsList: [
                                                                                        "16:9"
                                                                                    ]
                                                                                }
                                                                            },
                                                                            fields: [
                                                                                {
                                                                                    type: "file",
                                                                                    list: false,
                                                                                    label: "File",
                                                                                    help: "How to change the start image of a video please see http://acme.com/dam FAQ",
                                                                                    fieldId: "file",
                                                                                    id: "teaserRoutingCardMediaFile",
                                                                                    storageId:
                                                                                        "file@teaserRoutingCardMediaFile"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "text-input"
                                                                                    },
                                                                                    label: "Alternative text",
                                                                                    help: "If not selected then image is marked as decorative. Please refer to Showroom, topic “WCAG” to learn more.",
                                                                                    fieldId:
                                                                                        "altText",
                                                                                    id: "teaserRoutingCardMediaAltText",
                                                                                    storageId:
                                                                                        "text@teaserRoutingCardMediaAltText"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    list: false,
                                                                                    renderer: {
                                                                                        name: "slug-field-input"
                                                                                    },
                                                                                    label: "SEO name",
                                                                                    help: "Example: My selfie will be delivered as my-selfie.jpg. Used for SEO.",
                                                                                    fieldId:
                                                                                        "seoName",
                                                                                    id: "teaserRoutingCardMediaSeoName",
                                                                                    storageId:
                                                                                        "text@teaserRoutingCardMediaSeoName"
                                                                                },
                                                                                {
                                                                                    type: "text",
                                                                                    validation: [],
                                                                                    renderer: {
                                                                                        name: "text-and-copy-input"
                                                                                    },
                                                                                    label: "Crop values",
                                                                                    help: "The value used to crop this media.",
                                                                                    fieldId: "crop",
                                                                                    id: "teaserRoutingCardMediaCrop",
                                                                                    storageId:
                                                                                        "text@teaserRoutingCardMediaCrop",
                                                                                    settings: {
                                                                                        disabled: true
                                                                                    }
                                                                                }
                                                                            ],
                                                                            layout: [
                                                                                [
                                                                                    "teaserRoutingCardMediaFile"
                                                                                ],
                                                                                [
                                                                                    "teaserRoutingCardMediaAltText"
                                                                                ],
                                                                                [
                                                                                    "teaserRoutingCardMediaSeoName"
                                                                                ],
                                                                                [
                                                                                    "teaserRoutingCardMediaCrop"
                                                                                ]
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "select-box"
                                                                        },
                                                                        label: "Background option",
                                                                        predefinedValues: {
                                                                            enabled: true,
                                                                            values: [
                                                                                {
                                                                                    label: "Fixed Width",
                                                                                    value: "fixed",
                                                                                    selected: true
                                                                                },
                                                                                {
                                                                                    label: "Transparent Background",
                                                                                    value: "transparent"
                                                                                },
                                                                                {
                                                                                    label: "White Background",
                                                                                    value: "white"
                                                                                }
                                                                            ]
                                                                        },
                                                                        fieldId: "backgroundOption",
                                                                        id: "teaserRoutingCardBackgroundOption",
                                                                        storageId:
                                                                            "text@teaserRoutingBackgroundOption"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        validation: [
                                                                            {
                                                                                name: "required",
                                                                                message:
                                                                                    "Value is required."
                                                                            }
                                                                        ],
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "enhanced-text-input"
                                                                        },
                                                                        label: "Teaser title",
                                                                        help: "If empty, teaser title from relative linked page teaser content will be shown. Max. 70 characters recommended.",
                                                                        fieldId: "title",
                                                                        id: "teaserRoutingCardTitle",
                                                                        storageId:
                                                                            "text@teaserTitle",
                                                                        settings: {
                                                                            inputField: {
                                                                                rows: 2
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        list: false,
                                                                        renderer: {
                                                                            name: "enhanced-text-input"
                                                                        },
                                                                        label: "Text",
                                                                        help: "It's recommended to not exceed a length of 150 characters.",
                                                                        fieldId: "text",
                                                                        id: "teaserRoutingCardText",
                                                                        storageId:
                                                                            "text@teaserText",
                                                                        settings: {
                                                                            inputField: {
                                                                                rows: 5
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        renderer: {
                                                                            name: "text-input"
                                                                        },
                                                                        validation: [
                                                                            {
                                                                                name: "required",
                                                                                message:
                                                                                    "Value is required."
                                                                            },
                                                                            {
                                                                                name: "pattern",
                                                                                settings: {
                                                                                    preset: "url"
                                                                                },
                                                                                message:
                                                                                    "URL Format is required"
                                                                            }
                                                                        ],
                                                                        label: "Link",
                                                                        fieldId: "linkpicker",
                                                                        id: "teaserRoutingCardLink",
                                                                        help: "If link is SmartCMS internal, create link relative via <Picker> to avoid 404 errors",
                                                                        storageId:
                                                                            "text@teaserRoutingCardLink"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        validation: [],
                                                                        renderer: {
                                                                            name: "text-input"
                                                                        },
                                                                        label: "FragmentUUID",
                                                                        help: "The technical ID of this element.",
                                                                        fieldId: "uuid",
                                                                        id: "teaserRoutingCardUuid",
                                                                        storageId:
                                                                            "text@teaserRoutingCardUuid"
                                                                    }
                                                                ],
                                                                layout: [
                                                                    ["teaserRoutingCardMedia"],
                                                                    [
                                                                        "teaserRoutingCardBackgroundOption"
                                                                    ],
                                                                    ["teaserRoutingCardTitle"],
                                                                    ["teaserRoutingCardText"],
                                                                    ["teaserRoutingCardLink"],
                                                                    ["teaserRoutingCardUuid"]
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    label: "Teaser Card",
                                                    help: "Select one or more of the allowed elements or fragments. Be aware the title of the elements isn’t delivered live.",
                                                    fieldId: "teaserRoutingCards",
                                                    id: "teaserRoutingCards",
                                                    storageId: "text@teaserRoutingCards"
                                                }
                                            ],
                                            layout: [
                                                ["teaserRoutingTitle"],
                                                ["teaserRoutingLayout", "teaserRoutingVariation"],
                                                ["teaserRoutingCards"],
                                                ["teaserRoutingUuid"]
                                            ]
                                        }
                                    ]
                                },
                                storageId: "dynamicZone@mainZone"
                            })
                        ],
                        layout: [["introZone"], ["mainZone"]]
                    },
                    {
                        name: "Press Release",
                        gqlTypeName: "PressReleasePageTemplate",
                        icon: "fas/camera",
                        description: "Press Release Page",
                        id: "pressReleasePageTemplate",
                        fields: [],
                        layout: []
                    }
                ]
            },
            predefinedValues: {
                enabled: false,
                values: []
            },
            storageId: "dynamicZone@pageTemplate"
        })
    ]
});
