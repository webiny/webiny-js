import { createCmsGroup, createCmsModel } from "@webiny/api-headless-cms";

export const createTestStructure = () => {
    return [createTestGroup(), createTestModel()];
};
const createTestGroup = () => {
    return createCmsGroup({
        id: "homepage",
        name: "Homepage",
        description: "Homepage content model group",
        slug: "homepage",
        icon: {
            type: "emoji",
            name: "thumbs_up",
            value: "👍"
        }
    });
};
const createTestModel = () => {
    return createCmsModel({
        name: "homepage",
        modelId: "homepage",
        description: "Homepage content model",
        group: {
            id: "homepage",
            name: "Homepage"
        },
        fields: [
            {
                id: "homepageTitle",
                fieldId: "homepageTitle",
                type: "text",
                label: "Title",
                multipleValues: false,
                renderer: {
                    name: "text-input"
                },
                validation: [],
                settings: {}
                // storageId: "text@homepageTitle"
            },
            {
                id: "items",
                fieldId: "items",
                type: "dynamicZone",
                label: "Items on the homepage",
                multipleValues: true,
                renderer: {
                    name: "dynamicZone"
                },
                validation: [],
                settings: {
                    templates: [
                        {
                            description: "List of customer reviews",
                            icon: {
                                type: "emoji",
                                name: "thumbs_up",
                                value: "👍"
                            },
                            id: "homepage_customer_reviews",
                            name: "CustomerReviews",
                            fields: [
                                {
                                    id: "customerReview",
                                    fieldId: "customerReview",
                                    type: "object",
                                    label: "Customer Review",
                                    multipleValues: true,
                                    renderer: {
                                        name: "objects"
                                    },
                                    validation: [],
                                    layout: [
                                        ["customerReviewCustomerName"],
                                        ["customerReviewMessage"],
                                        ["customerReviewRating"]
                                    ],
                                    settings: {
                                        fields: [
                                            {
                                                id: "customerReviewCustomerName",
                                                fieldId: "customerReviewCustomerName",
                                                type: "text",
                                                label: "Name of the customer",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                validation: [
                                                    {
                                                        name: "Value is required."
                                                    }
                                                ],
                                                settings: {}
                                                // storageId: "text@customerReviewCustomerName"
                                            },
                                            {
                                                id: "customerReviewMessage",
                                                fieldId: "customerReviewMessage",
                                                type: "text",
                                                label: "Message of the customer",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                validation: [
                                                    {
                                                        name: "Value is required."
                                                    }
                                                ],
                                                settings: {}
                                                // storageId: "text@customerReviewMessage"
                                            },
                                            {
                                                id: "customerReviewRating",
                                                fieldId: "customerReviewRating",
                                                type: "number",
                                                label: "Customer Review Rating",
                                                helpText: "Rating from 1 to 5",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "number-input"
                                                },
                                                validation: [
                                                    {
                                                        name: "Value is required."
                                                    }
                                                ],
                                                settings: {}
                                                // storageId: "number@customerReviewRating"
                                            }
                                        ]
                                    }
                                    // storageId: "object@customerReview"
                                },
                                {
                                    id: "customerReviewsTitle",
                                    fieldId: "customerReviewsTitle",
                                    type: "text",
                                    label: "CustomerReviewsTitle",
                                    multipleValues: false,
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "Value is required."
                                        }
                                    ],
                                    settings: {}
                                    // storageId: "text@customerReviewsTitle"
                                }
                            ],
                            validation: []
                        },
                        {
                            description: "Hero component",
                            icon: {
                                type: "emoji",
                                name: "thumbs_up",
                                value: "👍"
                            },
                            id: "homepage_hero",
                            name: "Hero",
                            fields: [
                                {
                                    id: "heroTitle",
                                    fieldId: "heroTitle",
                                    type: "text",
                                    label: "HeroTitle",
                                    multipleValues: false,
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "Value is required."
                                        }
                                    ],
                                    settings: {}
                                    // storageId: "text@heroTitle"
                                },
                                {
                                    id: "heroBenefit",
                                    fieldId: "heroBenefit",
                                    type: "text",
                                    label: "Benefit",
                                    multipleValues: true,
                                    renderer: {
                                        name: "text-inputs"
                                    },
                                    validation: [],
                                    settings: {}
                                    // storageId: "text@heroBenefit"
                                },
                                {
                                    id: "heroImage",
                                    fieldId: "heroImage",
                                    type: "file",
                                    label: "Image",
                                    multipleValues: false,
                                    renderer: {
                                        name: "file-input"
                                    },
                                    validation: [],
                                    settings: {}
                                    // storageId: "file@heroImage"
                                }
                            ],
                            validation: []
                        },
                        {
                            description: "Compare the good and bad",
                            icon: {
                                type: "emoji",
                                name: "thumbs_up",
                                value: "👍"
                            },
                            id: "homepage_compare_table",
                            name: "CompareTable",
                            fields: [
                                {
                                    id: "compareTableTitle",
                                    fieldId: "compareTableTitle",
                                    type: "text",
                                    label: "CompareTableTitle",
                                    multipleValues: false,
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "Value is required."
                                        }
                                    ],
                                    settings: {}
                                    // storageId: "text@compareTableTitle"
                                },
                                {
                                    id: "compareTableCategory",
                                    fieldId: "compareTableCategory",
                                    type: "object",
                                    label: "Compare Category",
                                    helpText: "The category for which to compare the two sides",
                                    multipleValues: true,
                                    renderer: {
                                        name: "objects"
                                    },
                                    validation: [],
                                    settings: {
                                        fields: [
                                            {
                                                id: "compareCategoryTitle",
                                                fieldId: "compareCategoryTitle",
                                                type: "text",
                                                label: "title",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                validation: [],
                                                settings: {}
                                                // storageId: "text@compareCategoryTitle"
                                            },
                                            {
                                                id: "good",
                                                fieldId: "good",
                                                type: "text",
                                                label: "Description of the good side",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                validation: [],
                                                settings: {}
                                                // storageId: "text@good"
                                            },
                                            {
                                                id: "bad",
                                                fieldId: "bad",
                                                type: "text",
                                                label: "Description of the bad side",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                validation: [],
                                                settings: {}
                                                // storageId: "text@bad"
                                            }
                                        ]
                                    }
                                    // storageId: "object@compareTableCategory"
                                },
                                {
                                    id: "comparisonTableNameOfGoodSide",
                                    fieldId: "comparisonTableNameOfGoodSide",
                                    type: "text",
                                    label: "Name of Good Side",
                                    helpText: "E.g. Utisha",
                                    multipleValues: false,
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [],
                                    settings: {}
                                    // storageId: "text@comparisonTableNameOfGoodSide"
                                },
                                {
                                    id: "comparisonTableNameOfBadSide",
                                    fieldId: "comparisonTableNameOfBadSide",
                                    type: "text",
                                    label: "Name of Bad Side",
                                    multipleValues: false,
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [],
                                    settings: {}
                                    // storageId: "text@comparisonTableNameOfBadSide"
                                }
                            ],
                            validation: []
                        },
                        {
                            description: "List of teachers on the homepage",
                            icon: {
                                type: "emoji",
                                name: "thumbs_up",
                                value: "👍"
                            },
                            id: "homepage_teachers",
                            name: "Teachers",
                            fields: [
                                {
                                    id: "teacher",
                                    fieldId: "teacher",
                                    type: "object",
                                    label: "Teacher",
                                    multipleValues: true,
                                    renderer: {
                                        name: "objects"
                                    },
                                    validation: [],
                                    layout: [["name"], ["expertiseArea"], ["image"]],
                                    settings: {
                                        fields: [
                                            {
                                                id: "teacherName",
                                                fieldId: "teacherName",
                                                type: "text",
                                                label: "Name of the teacher",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "text-input"
                                                },
                                                validation: [],
                                                settings: {}
                                                // storageId: "text@teacherName"
                                            },
                                            {
                                                id: "teacherExpertiseArea",
                                                fieldId: "teacherExpertiseArea",
                                                type: "text",
                                                label: "Expertise Area",
                                                helpText: "E.g. fitness, yoga, strength training",
                                                multipleValues: true,
                                                renderer: {
                                                    name: "text-inputs"
                                                },
                                                validation: [],
                                                settings: {}
                                                // storageId: "text@teacherExpertiseArea"
                                            },
                                            {
                                                id: "teacherImage",
                                                fieldId: "teacherImage",
                                                type: "file",
                                                label: "TeacherImage",
                                                multipleValues: false,
                                                renderer: {
                                                    name: "file-input"
                                                },
                                                validation: [],
                                                settings: {}
                                                // storageId: "file@teacherImage"
                                            }
                                        ]
                                    }
                                    // storageId: "object@teacher"
                                },
                                {
                                    id: "title",
                                    fieldId: "title",
                                    type: "text",
                                    label: "Title",
                                    multipleValues: false,
                                    renderer: {
                                        name: "text-input"
                                    },
                                    validation: [
                                        {
                                            name: "Value is required."
                                        }
                                    ],
                                    settings: {}
                                    // storageId: "text@title"
                                }
                            ],
                            validation: []
                        }
                    ]
                }
                // storageId: "dynamicZone@items"
            }
        ],
        layout: [["homepageTitle"], ["items"]],
        titleFieldId: "homepageTitle",
        singularApiName: "Homepage",
        pluralApiName: "Homepages"
    });
};
