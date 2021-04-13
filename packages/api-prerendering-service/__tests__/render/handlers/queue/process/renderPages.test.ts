import useHandler from "./useHandler";
import createRenderEntry from "./mocks/createRenderEntry";
import createTagLinkEntry from "./mocks/createTagLinkEntry";
import createQueueJobEntry from "./mocks/createQueueJobEntry";

describe("Render Pages Test", () => {
    it("should render all pages with a specific tag", async () => {
        // With this section, we are intercepting all render handler invocations, and inspecting the passed args.
        const issuedRenders = [];
        const { handler, dynamoDbDriver, defaults } = useHandler({
            type: "handler-client-handler-render-handler",
            name: "handler-client-handler-render-handler",
            invoke(args) {
                issuedRenders.push(args);
            }
        });

        // 1. Let's first create a random render entry. It should not be taken into consideration in queue jobs
        // we're about to add below. Note that once we've create the render entry, we also create a tag-url link.
        const tags = [
            { value: `page-random-id`, key: "pb-page" },
            { key: "pb-menu", value: "not-main-menu" }
        ];

        const url = `https://site.com/random-path`;
        await dynamoDbDriver.create({
            ...defaults.db,
            data: createRenderEntry({
                url,
                files: [
                    {
                        name: "index.html",
                        type: "text/html",
                        meta: {
                            tags
                        }
                    }
                ]
            })
        });

        for (let j = 0; j < tags.length; j++) {
            const tag = tags[j];
            await dynamoDbDriver.create({
                ...defaults.db,
                data: createTagLinkEntry({
                    url,
                    ...tag
                })
            });
        }

        // 2. Now, let's create three render entries with the `{ value: "main-menu", key: "pb-menu" }` tag. Note
        // that once we've created those, we area also creating a tag-url link for every tag in the render entry.
        for (let i = 0; i < 3; i++) {
            const url = `https://site.com/path-${i}`;
            const tags = [
                { value: `page-id-${i}`, key: "pb-page" },
                { value: "main-menu", key: "pb-menu" }
            ];

            await dynamoDbDriver.create({
                ...defaults.db,
                data: createRenderEntry({
                    url,
                    files: [
                        {
                            name: "index.html",
                            type: "text/html",
                            meta: {
                                tags
                            }
                        }
                    ]
                })
            });

            for (let j = 0; j < tags.length; j++) {
                const tag = tags[j];
                await dynamoDbDriver.create({
                    ...defaults.db,
                    data: createTagLinkEntry({
                        url,
                        ...tag
                    })
                });
            }
        }

        // 3. Let's create a random job first - should not do anything.

        // 4. Let's create a job that needs to rerender all pages with the `{ value: "main-menu", key: "pb-menu" }` tag.
        await dynamoDbDriver.create({
            ...defaults.db,
            data: createQueueJobEntry({
                render: {
                    configuration: {
                        db: {
                            namespace: "T#root"
                        }
                    },
                    tag: {
                        key: "pb-menu",
                        value: "main-menu"
                    }
                }
            })
        });

        // 5. Let's also create a job that doesn't affect anything.
        await dynamoDbDriver.create({
            ...defaults.db,
            data: createQueueJobEntry({
                render: {
                    configuration: {
                        db: {
                            namespace: "T#root"
                        }
                    },
                    tag: {
                        key: "pb-menu",
                        value: "non-existing-menu"
                    }
                }
            })
        });

        // 6. Let's do the testing.
        // 6.1. A total of two jobs must be present in the queue.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "PS#Q#JOB",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(2));

        // 6.2. A total of four render entries must be present.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "T#root#PS#RENDER",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(4));

        // 6.3. A total of three "pb-page" tag-url link entries must be present.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "T#root#PS#TAG#pb-page",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(4));

        // 6.4. A total of four "pb-menu" tags must be present in the queue.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "T#root#PS#TAG#pb-menu",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(4));

        expect(await handler()).toEqual({
            data: {
                stats: {
                    jobs: {
                        renderAll: 0,
                        retrieved: 2,
                        unique: 2
                    }
                }
            },
            error: null
        });

        expect(issuedRenders).toEqual([
            [
                {
                    url: "https://site.com/path-0",
                    configuration: {
                        meta: {
                            cloudfront: {
                                distributionId: "xyz"
                            }
                        },
                        db: {
                            namespace: "T#root"
                        },
                        storage: {
                            name: "s3-bucket-name",
                            folder: "test-folder"
                        }
                    }
                },
                {
                    url: "https://site.com/path-1",
                    configuration: {
                        meta: {
                            cloudfront: {
                                distributionId: "xyz"
                            }
                        },
                        db: {
                            namespace: "T#root"
                        },
                        storage: {
                            name: "s3-bucket-name",
                            folder: "test-folder"
                        }
                    }
                },
                {
                    url: "https://site.com/path-2",
                    configuration: {
                        meta: {
                            cloudfront: {
                                distributionId: "xyz"
                            }
                        },
                        db: {
                            namespace: "T#root"
                        },
                        storage: {
                            name: "s3-bucket-name",
                            folder: "test-folder"
                        }
                    }
                }
            ]
        ]);
    });
});
