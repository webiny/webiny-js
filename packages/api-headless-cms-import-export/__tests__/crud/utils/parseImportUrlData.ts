import { parseImportUrlData } from "~/crud/utils/parseImportUrlData";

describe("parseImportUrlData", () => {
    it("should properly parse string data", async () => {
        const result = parseImportUrlData(
            JSON.stringify({
                model: {
                    modelId: "authors",
                    name: "Authors",
                    group: "659dacad78fc4c0008fb82fe",
                    icon: "fab/redhat",
                    description: "author",
                    singularApiName: "Author",
                    pluralApiName: "Authors",
                    fields: [
                        {
                            multipleValues: false,
                            listValidation: [],
                            settings: {},
                            renderer: { name: "text-input", settings: {} },
                            helpText: null,
                            predefinedValues: { enabled: false, values: [] },
                            label: "Name",
                            type: "text",
                            tags: [],
                            placeholderText: null,
                            id: "gb6mroog",
                            validation: [
                                {
                                    name: "required",
                                    message: "Title is a required field.",
                                    settings: {}
                                }
                            ],
                            storageId: "text@gb6mroog",
                            fieldId: "title"
                        },
                        {
                            multipleValues: false,
                            listValidation: [],
                            settings: {},
                            renderer: { name: "long-text-text-area", settings: {} },
                            helpText: null,
                            predefinedValues: { enabled: false, values: [] },
                            label: "Description",
                            type: "long-text",
                            tags: [],
                            placeholderText: null,
                            id: "od1cn25t",
                            validation: [],
                            storageId: "long-text@od1cn25t",
                            fieldId: "description"
                        },
                        {
                            multipleValues: false,
                            listValidation: [],
                            settings: { imagesOnly: true },
                            renderer: { name: "file-input", settings: {} },
                            helpText: null,
                            predefinedValues: { enabled: false, values: [] },
                            label: "Image",
                            type: "file",
                            tags: [],
                            placeholderText: null,
                            id: "wr4z5wa9",
                            validation: [],
                            storageId: "file@wr4z5wa9",
                            fieldId: "image"
                        },
                        {
                            multipleValues: true,
                            listValidation: [],
                            settings: {},
                            renderer: { name: "file-inputs" },
                            helpText: null,
                            predefinedValues: { enabled: false, values: [] },
                            label: "Files",
                            type: "file",
                            tags: [],
                            placeholderText: null,
                            id: "qjftjbsf",
                            validation: [],
                            storageId: "file@qjftjbsf",
                            fieldId: "files"
                        }
                    ],
                    layout: [["gb6mroog"], ["od1cn25t", "wr4z5wa9"], ["qjftjbsf"]],
                    titleFieldId: "title",
                    descriptionFieldId: "description",
                    imageFieldId: "image",
                    tags: ["type:model"]
                },
                files: [
                    {
                        get: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/entries.we.zip?&x-id=GetObject",
                        head: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/entries.we.zip?",
                        key: "authors/66d853af79ff7500086231748m0nub0sj/entries.we.zip",
                        checksum: "351908052acc58ced0761cbbdffc5b64",
                        type: "entries"
                    },
                    {
                        get: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/assets..wa.zip?&x-id=GetObject",
                        head: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/assets..wa.zip?",
                        key: "authors/66d853af79ff7500086231748m0nub0sj/assets..wa.zip",
                        checksum: "b7ef1426390086e7050d98bf9d4a6937-48",
                        type: "assets"
                    }
                ]
            })
        );

        expect(result).toEqual({
            model: expect.any(Object),
            files: expect.any(Array)
        });
    });

    it("should properly parse object data", async () => {
        const result = parseImportUrlData({
            model: {
                modelId: "authors",
                name: "Authors",
                group: "659dacad78fc4c0008fb82fe",
                icon: "fab/redhat",
                description: "author",
                singularApiName: "Author",
                pluralApiName: "Authors",
                fields: [
                    {
                        multipleValues: false,
                        listValidation: [],
                        settings: {},
                        renderer: { name: "text-input", settings: {} },
                        helpText: null,
                        predefinedValues: { enabled: false, values: [] },
                        label: "Name",
                        type: "text",
                        tags: [],
                        placeholderText: null,
                        id: "gb6mroog",
                        validation: [
                            {
                                name: "required",
                                message: "Title is a required field.",
                                settings: {}
                            }
                        ],
                        storageId: "text@gb6mroog",
                        fieldId: "title"
                    },
                    {
                        multipleValues: false,
                        listValidation: [],
                        settings: {},
                        renderer: { name: "long-text-text-area", settings: {} },
                        helpText: null,
                        predefinedValues: { enabled: false, values: [] },
                        label: "Description",
                        type: "long-text",
                        tags: [],
                        placeholderText: null,
                        id: "od1cn25t",
                        validation: [],
                        storageId: "long-text@od1cn25t",
                        fieldId: "description"
                    },
                    {
                        multipleValues: false,
                        listValidation: [],
                        settings: { imagesOnly: true },
                        renderer: { name: "file-input", settings: {} },
                        helpText: null,
                        predefinedValues: { enabled: false, values: [] },
                        label: "Image",
                        type: "file",
                        tags: [],
                        placeholderText: null,
                        id: "wr4z5wa9",
                        validation: [],
                        storageId: "file@wr4z5wa9",
                        fieldId: "image"
                    },
                    {
                        multipleValues: true,
                        listValidation: [],
                        settings: {},
                        renderer: { name: "file-inputs" },
                        helpText: null,
                        predefinedValues: { enabled: false, values: [] },
                        label: "Files",
                        type: "file",
                        tags: [],
                        placeholderText: null,
                        id: "qjftjbsf",
                        validation: [],
                        storageId: "file@qjftjbsf",
                        fieldId: "files"
                    }
                ],
                layout: [["gb6mroog"], ["od1cn25t", "wr4z5wa9"], ["qjftjbsf"]],
                titleFieldId: "title",
                descriptionFieldId: "description",
                imageFieldId: "image",
                tags: ["type:model"]
            },
            files: [
                {
                    get: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/entries.we.zip?&x-id=GetObject",
                    head: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/entries.we.zip?",
                    key: "authors/66d853af79ff7500086231748m0nub0sj/entries.we.zip",
                    checksum: "351908052acc58ced0761cbbdffc5b64",
                    type: "entries"
                },
                {
                    get: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/assets..wa.zip?&x-id=GetObject",
                    head: "https://wby-fm-bucket-99ce7db.s3.eu-central-1.amazonaws.com/cms-export/authors/66d853af79ff7500086231748m0nub0sj/assets..wa.zip?",
                    key: "authors/66d853af79ff7500086231748m0nub0sj/assets..wa.zip",
                    checksum: "b7ef1426390086e7050d98bf9d4a6937-48",
                    type: "assets"
                }
            ]
        });
        expect(result).toEqual({
            model: expect.any(Object),
            files: expect.any(Array)
        });
    });

    it("should fail to parse invalid string data", async () => {
        expect.assertions(1);
        try {
            parseImportUrlData("some wrong data");
        } catch (ex) {
            expect(ex.message).toEqual("Invalid input data provided.");
        }
    });

    it("should fail to parse invalid object data", async () => {
        expect.assertions(2);
        try {
            parseImportUrlData({ model: {}, files: [] });
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.data).toEqual({
                invalidFields: {
                    "model.fields": {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["model", "fields"]
                        },
                        message: "Required"
                    },
                    "model.modelId": {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["model", "modelId"]
                        },
                        message: "Required"
                    }
                }
            });
        }
    });
});
