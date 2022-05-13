import useGqlHandler from "../useGqlHandler";

const richTextData = {
    editor: "webiny",
    data: [
        {
            tag: "h1",
            content: "h1 title"
        },
        {
            tag: "p",
            content: "paragraph text"
        },
        {
            tag: "div",
            content: [
                {
                    tag: "p",
                    content: "content paragraph text"
                },
                {
                    tag: "a",
                    content: "some url",
                    href: "https://www.webiny.com/"
                }
            ]
        }
    ]
};
const simpleRichTextData = {
    editor: "webiny",
    data: [
        {
            tag: "h1",
            content: "title"
        }
    ]
};

const fileData = {
    key: "/files/filenameA.png",
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["sketch"],
    richText: richTextData
};
/**
 * Add fields that are added via the plugins so we get them back in the result.
 */
const extraFields = ["richText {editor data}"];

describe("Files CRUD ddb/es", () => {
    const {
        createFile,
        updateFile,
        getFile,
        listFiles,
        clearElasticsearch,
        until,
        createElasticsearchIndice
    } = useGqlHandler();

    const locale = "en-US";
    const tenant = "root";

    beforeEach(async () => {
        await clearElasticsearch({
            locale,
            tenant
        });
        await createElasticsearchIndice({
            locale,
            tenant
        });
    });
    afterEach(async () => {
        await clearElasticsearch({
            locale,
            tenant
        });
    });

    test("it should create a new file with custom richText field and then update it", async () => {
        /**
         * Create the file with custom field.
         */
        const [createResponse] = await createFile(
            {
                data: fileData
            },
            extraFields
        );

        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: {
                            ...fileData,
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });
        const id = createResponse.data.fileManager.createFile.data.id;

        /**
         * Wait until the data is available.
         */
        await until(
            () => listFiles({}).then(([data]: any) => data),
            ({ data }: any) => {
                return (
                    data.fileManager.listFiles.data.length === 1 &&
                    data.fileManager.listFiles.data[0].id === id
                );
            },
            { name: "list all files after create", tries: 10 }
        );
        /**
         * The file must contain that custom field.
         */
        const [getResponse] = await getFile(
            {
                id
            },
            ["id"].concat(extraFields)
        );

        expect(getResponse).toEqual({
            data: {
                fileManager: {
                    getFile: {
                        data: {
                            ...fileData,
                            id
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Update the file data custom field with some new data.
         */
        const [updateResponse] = await updateFile(
            {
                id,
                data: {
                    ...fileData,
                    richText: simpleRichTextData
                }
            },
            ["id"].concat(extraFields)
        );
        expect(updateResponse).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: {
                            ...fileData,
                            richText: simpleRichTextData,
                            id
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * The file must contain updated custom field.
         */
        const [getUpdatedResponse] = await getFile(
            {
                id
            },
            ["id"].concat(extraFields)
        );

        expect(getUpdatedResponse).toEqual({
            data: {
                fileManager: {
                    getFile: {
                        data: {
                            ...fileData,
                            richText: simpleRichTextData,
                            id
                        },
                        error: null
                    }
                }
            }
        });
    });
});
