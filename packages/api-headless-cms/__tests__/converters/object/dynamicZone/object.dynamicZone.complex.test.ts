import { beforeEach, describe, expect, it } from "vitest";
import { createModel } from "../../mocks/model.js";
import { createModelField } from "../../mocks/field.js";
import { getConverters, type IConvertersResponse } from "../../__helpers/converters.js";

const plainValue = {
    profile: {
        articleContent: {
            _templateId: "articleTemplate",
            header: {
                title: "Article Title",
                metadata: {
                    _templateId: "metaTemplate",
                    author: "John Doe",
                    publishDate: "2026-02-09T10:00:00Z"
                }
            },
            sections: [
                {
                    sectionTitle: "Introduction",
                    sectionContent: {
                        _templateId: "textContentTemplate",
                        body: "Introduction text with <strong>bold</strong>.",
                        wordCount: 150
                    }
                },
                {
                    sectionTitle: "Main Content",
                    sectionContent: {
                        _templateId: "richContentTemplate",
                        richBody: "Main content with <em>emphasis</em>.",
                        tags: ["important", "featured"]
                    }
                }
            ]
        },
        videoContent: {
            _templateId: "videoTemplate",
            videoInfo: {
                videoTitle: "My Video",
                details: {
                    _templateId: "videoDetailsTemplate",
                    duration: 3600,
                    resolution: "1080p"
                }
            },
            chapters: [
                {
                    chapterName: "Introduction",
                    chapterMeta: {
                        _templateId: "chapterMetaTemplate",
                        timestamp: 0,
                        description: "Intro chapter"
                    }
                },
                {
                    chapterName: "Main Content",
                    chapterMeta: {
                        _templateId: "chapterMetaTemplate",
                        timestamp: 300,
                        description: "Main chapter"
                    }
                }
            ]
        }
    }
};

const convertedValue = {
    "object@profileId": {
        "dynamicZone@articleContentId": {
            _templateId: "articleTemplate",
            "object@headerId": {
                "text@titleId": "Article Title",
                "dynamicZone@metadataId": {
                    _templateId: "metaTemplate",
                    "text@authorId": "John Doe",
                    "datetime@publishDateId": "2026-02-09T10:00:00Z"
                }
            },
            "object@sectionsId": [
                {
                    "text@sectionTitleId": "Introduction",
                    "dynamicZone@sectionContentId": {
                        _templateId: "textContentTemplate",
                        "long-text@bodyId": "Introduction text with <strong>bold</strong>.",
                        "number@wordCountId": 150
                    }
                },
                {
                    "text@sectionTitleId": "Main Content",
                    "dynamicZone@sectionContentId": {
                        _templateId: "richContentTemplate",
                        "rich-text@richBodyId": "Main content with <em>emphasis</em>.",
                        "text@tagsId": ["important", "featured"]
                    }
                }
            ]
        },
        "dynamicZone@videoContentId": {
            _templateId: "videoTemplate",
            "object@videoInfoId": {
                "text@videoTitleId": "My Video",
                "dynamicZone@detailsId": {
                    _templateId: "videoDetailsTemplate",
                    "number@durationId": 3600,
                    "text@resolutionId": "1080p"
                }
            },
            "object@chaptersId": [
                {
                    "text@chapterNameId": "Introduction",
                    "dynamicZone@chapterMetaId": {
                        _templateId: "chapterMetaTemplate",
                        "number@timestampId": 0,
                        "text@descriptionId": "Intro chapter"
                    }
                },
                {
                    "text@chapterNameId": "Main Content",
                    "dynamicZone@chapterMetaId": {
                        _templateId: "chapterMetaTemplate",
                        "number@timestampId": 300,
                        "text@descriptionId": "Main chapter"
                    }
                }
            ]
        }
    }
};

const model = createModel({
    fields: [
        createModelField({
            fieldId: "profile",
            type: "object",
            multipleValues: false,
            settings: {
                fields: [
                    createModelField({
                        fieldId: "articleContent",
                        type: "dynamicZone",
                        multipleValues: false,
                        settings: {
                            templates: [
                                {
                                    id: "articleTemplate",
                                    name: "Article Template",
                                    gqlTypeName: "ArticleTemplate",
                                    icon: undefined,
                                    description: "",
                                    fields: [
                                        createModelField({
                                            fieldId: "header",
                                            type: "object",
                                            multipleValues: false,
                                            settings: {
                                                fields: [
                                                    createModelField({
                                                        fieldId: "title",
                                                        type: "text",
                                                        multipleValues: false
                                                    }),
                                                    createModelField({
                                                        fieldId: "metadata",
                                                        type: "dynamicZone",
                                                        multipleValues: false,
                                                        settings: {
                                                            templates: [
                                                                {
                                                                    id: "metaTemplate",
                                                                    name: "Meta Template",
                                                                    gqlTypeName: "MetaTemplate",
                                                                    icon: undefined,
                                                                    description: "",
                                                                    fields: [
                                                                        createModelField({
                                                                            fieldId: "author",
                                                                            type: "text",
                                                                            multipleValues: false
                                                                        }),
                                                                        createModelField({
                                                                            fieldId: "publishDate",
                                                                            type: "datetime",
                                                                            multipleValues: false
                                                                        })
                                                                    ],
                                                                    layout: [],
                                                                    validation: []
                                                                }
                                                            ]
                                                        }
                                                    })
                                                ]
                                            }
                                        }),
                                        createModelField({
                                            fieldId: "sections",
                                            type: "object",
                                            multipleValues: true,
                                            settings: {
                                                fields: [
                                                    createModelField({
                                                        fieldId: "sectionTitle",
                                                        type: "text",
                                                        multipleValues: false
                                                    }),
                                                    createModelField({
                                                        fieldId: "sectionContent",
                                                        type: "dynamicZone",
                                                        multipleValues: false,
                                                        settings: {
                                                            templates: [
                                                                {
                                                                    id: "textContentTemplate",
                                                                    name: "Text Content Template",
                                                                    gqlTypeName: "TextContentTemplate",
                                                                    icon: undefined,
                                                                    description: "",
                                                                    fields: [
                                                                        createModelField({
                                                                            fieldId: "body",
                                                                            type: "long-text",
                                                                            multipleValues: false
                                                                        }),
                                                                        createModelField({
                                                                            fieldId: "wordCount",
                                                                            type: "number",
                                                                            multipleValues: false
                                                                        })
                                                                    ],
                                                                    layout: [],
                                                                    validation: []
                                                                },
                                                                {
                                                                    id: "richContentTemplate",
                                                                    name: "Rich Content Template",
                                                                    gqlTypeName: "RichContentTemplate",
                                                                    icon: undefined,
                                                                    description: "",
                                                                    fields: [
                                                                        createModelField({
                                                                            fieldId: "richBody",
                                                                            type: "rich-text",
                                                                            multipleValues: false
                                                                        }),
                                                                        createModelField({
                                                                            fieldId: "tags",
                                                                            type: "text",
                                                                            multipleValues: true
                                                                        })
                                                                    ],
                                                                    layout: [],
                                                                    validation: []
                                                                }
                                                            ]
                                                        }
                                                    })
                                                ]
                                            }
                                        })
                                    ],
                                    layout: [],
                                    validation: []
                                }
                            ]
                        }
                    }),
                    createModelField({
                        fieldId: "videoContent",
                        type: "dynamicZone",
                        multipleValues: false,
                        settings: {
                            templates: [
                                {
                                    id: "videoTemplate",
                                    name: "Video Template",
                                    gqlTypeName: "VideoTemplate",
                                    icon: undefined,
                                    description: "",
                                    fields: [
                                        createModelField({
                                            fieldId: "videoInfo",
                                            type: "object",
                                            multipleValues: false,
                                            settings: {
                                                fields: [
                                                    createModelField({
                                                        fieldId: "videoTitle",
                                                        type: "text",
                                                        multipleValues: false
                                                    }),
                                                    createModelField({
                                                        fieldId: "details",
                                                        type: "dynamicZone",
                                                        multipleValues: false,
                                                        settings: {
                                                            templates: [
                                                                {
                                                                    id: "videoDetailsTemplate",
                                                                    name: "Video Details Template",
                                                                    gqlTypeName: "VideoDetailsTemplate",
                                                                    icon: undefined,
                                                                    description: "",
                                                                    fields: [
                                                                        createModelField({
                                                                            fieldId: "duration",
                                                                            type: "number",
                                                                            multipleValues: false
                                                                        }),
                                                                        createModelField({
                                                                            fieldId: "resolution",
                                                                            type: "text",
                                                                            multipleValues: false
                                                                        })
                                                                    ],
                                                                    layout: [],
                                                                    validation: []
                                                                }
                                                            ]
                                                        }
                                                    })
                                                ]
                                            }
                                        }),
                                        createModelField({
                                            fieldId: "chapters",
                                            type: "object",
                                            multipleValues: true,
                                            settings: {
                                                fields: [
                                                    createModelField({
                                                        fieldId: "chapterName",
                                                        type: "text",
                                                        multipleValues: false
                                                    }),
                                                    createModelField({
                                                        fieldId: "chapterMeta",
                                                        type: "dynamicZone",
                                                        multipleValues: false,
                                                        settings: {
                                                            templates: [
                                                                {
                                                                    id: "chapterMetaTemplate",
                                                                    name: "Chapter Meta Template",
                                                                    gqlTypeName: "ChapterMetaTemplate",
                                                                    icon: undefined,
                                                                    description: "",
                                                                    fields: [
                                                                        createModelField({
                                                                            fieldId: "timestamp",
                                                                            type: "number",
                                                                            multipleValues: false
                                                                        }),
                                                                        createModelField({
                                                                            fieldId: "description",
                                                                            type: "text",
                                                                            multipleValues: false
                                                                        })
                                                                    ],
                                                                    layout: [],
                                                                    validation: []
                                                                }
                                                            ]
                                                        }
                                                    })
                                                ]
                                            }
                                        })
                                    ],
                                    layout: [],
                                    validation: []
                                }
                            ]
                        }
                    })
                ]
            }
        })
    ]
});

describe("object storage converter - complex nested dynamic zone with all possible combinations", () => {
    let converters: IConvertersResponse;

    beforeEach(async () => {
        converters = await getConverters(model);
    });

    it("should convert complex object with multiple dynamic zones containing all combinations of single/multiple objects with nested dynamic zones to and from storage", async () => {
        const { convertFromStorage, convertToStorage } = converters;

        const storageResult = convertToStorage({
            fields: model.fields,
            values: plainValue
        });

        expect(storageResult).toEqual(convertedValue);

        const fromStorageResult = convertFromStorage({
            fields: model.fields,
            values: storageResult
        });

        expect(fromStorageResult).toEqual(plainValue);
    });
});

