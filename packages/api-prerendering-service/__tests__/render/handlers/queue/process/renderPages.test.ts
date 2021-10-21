import useHandler from "./useHandler";
import createRenderEntry from "./mocks/createRenderEntry";
import createTagLinkEntry from "./mocks/createTagLinkEntry";
import createQueueJobEntry from "./mocks/createQueueJobEntry";
import { Render, TagUrlLink } from "~/types";

const namespace = "root";

describe("Render Pages Test", () => {
    it("should render all pages with a specific tag", async () => {
        /**
         * With this section, we are intercepting all render handler invocations, and inspecting the passed args.
         */
        const issuedRenders = [];
        const { handler, storageOperations } = useHandler({
            type: "handler-client-handler-render-handler",
            name: "handler-client-handler-render-handler",
            invoke(args) {
                issuedRenders.push(args);
            }
        });
        /**
         * 1. Let's first create a random render entry. It should not be taken into consideration in queue jobs
         * we're about to add below. Note that once we've create the render entry, we also create a tag-url link.
         */
        const tags = [
            { key: "pb-page", value: `page-random-id` },
            { key: "pb-menu", value: "not-main-menu" }
        ];

        const url = `https://site.com/random-path`;

        const render: Render = {
            namespace,
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
        };

        await storageOperations.createRender({
            render
        });

        const renderers = await storageOperations.listRenders({
            where: {
                namespace
            }
        });
        expect(renderers).toEqual([render]);

        const tagUrlLinks: TagUrlLink[] = tags.map(tag => {
            return {
                ...tag,
                url,
                namespace
            };
        });

        await storageOperations.createTagUrlLinks({
            tagUrlLinks
        });

        const listPbPageTagUrlLinks = await storageOperations.listTagUrlLinks({
            where: {
                namespace,
                tag: {
                    key: "pb-page"
                }
            }
        });
        expect(listPbPageTagUrlLinks).toHaveLength(1);

        const listPbMenuTagUrlLinks = await storageOperations.listTagUrlLinks({
            where: {
                namespace,
                tag: {
                    key: "pb-menu"
                }
            }
        });
        expect(listPbMenuTagUrlLinks).toHaveLength(1);
        /**
         * 2. Now, let's create three render entries with the `{ value: "main-menu", key: "pb-menu" }` tag. Note
         * that once we've created those, we area also creating a tag-url link for every tag in the render entry.
         */
        for (let i = 0; i < 3; i++) {
            const url = `https://site.com/path-${i}`;
            const tags = [
                { value: `page-id-${i}`, key: "pb-page" },
                { value: "main-menu", key: "pb-menu" }
            ];

            await storageOperations.createRender({
                render: createRenderEntry({
                    namespace,
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

            await storageOperations.createTagUrlLinks({
                tagUrlLinks: tags.map(tag => {
                    return createTagLinkEntry({
                        url,
                        namespace,
                        ...tag
                    });
                })
            });
        }

        /**
         * 3. Let's create a random job first - should not do anything.
         * TODO this step was empty, check why
         */

        /**
         * 4. Let's create a job that needs to rerender all pages with the `{ value: "main-menu", key: "pb-menu" }` tag.
         */
        await storageOperations.createQueueJob({
            queueJob: createQueueJobEntry({
                render: {
                    configuration: {
                        db: {
                            namespace: "root"
                        }
                    },
                    tag: {
                        key: "pb-menu",
                        value: "main-menu"
                    }
                }
            })
        });

        /**
         * 5. Let's also create a job that doesn't affect anything.
         */
        await storageOperations.createQueueJob({
            queueJob: createQueueJobEntry({
                render: {
                    configuration: {
                        db: {
                            namespace: "root"
                        }
                    },
                    tag: {
                        key: "pb-menu",
                        value: "non-existing-menu"
                    }
                }
            })
        });

        /**
         * 6. Let's do the testing.
         * 6.1. A total of two jobs must be present in the queue.
         */
        const queueJobsRecords = await storageOperations.listQueueJobs();
        expect(queueJobsRecords).toHaveLength(2);
        expect(queueJobsRecords).toEqual([
            {
                args: expect.any(Object),
                id: expect.any(String)
            },
            {
                args: expect.any(Object),
                id: expect.any(String)
            }
        ]);

        /**
         * 6.2. A total of four render entries must be present.
         */
        const renderRecords = await storageOperations.listRenders({
            where: {
                namespace
            }
        });
        expect(renderRecords).toHaveLength(4);
        expect(renderRecords).toMatchObject([
            {
                args: expect.any(Object),
                namespace,
                url: "https://site.com/path-0"
            },
            {
                args: expect.any(Object),
                namespace,
                url: "https://site.com/path-1"
            },
            {
                args: expect.any(Object),
                namespace,
                url: "https://site.com/path-2"
            },
            {
                namespace,
                url: "https://site.com/random-path"
            }
        ]);

        /**
         * 6.3. A total of four "pb-page" tag-url link entries must be present.
         */
        const tagUrlLinkPbPageRecords = await storageOperations.listTagUrlLinks({
            where: {
                namespace,
                tag: {
                    key: "pb-page"
                }
            }
        });
        expect(tagUrlLinkPbPageRecords).toHaveLength(4);
        expect(tagUrlLinkPbPageRecords).toEqual([
            {
                namespace,
                key: "pb-page",
                value: "page-id-0",
                url: "https://site.com/path-0"
            },
            {
                namespace,
                key: "pb-page",
                value: "page-id-1",
                url: "https://site.com/path-1"
            },
            {
                namespace,
                key: "pb-page",
                value: "page-id-2",
                url: "https://site.com/path-2"
            },
            {
                namespace,
                key: "pb-page",
                value: "page-random-id",
                url: "https://site.com/random-path"
            }
        ]);

        /**
         * 6.4. A total of four "pb-menu" tags must be present in the queue.
         */
        const tagUrlLinkPbMenuRecords = await storageOperations.listTagUrlLinks({
            where: {
                namespace,
                tag: {
                    key: "pb-menu"
                }
            }
        });
        expect(tagUrlLinkPbMenuRecords).toHaveLength(4);
        expect(tagUrlLinkPbMenuRecords).toEqual([
            {
                namespace,
                key: "pb-menu",
                value: "main-menu",
                url: "https://site.com/path-0"
            },
            {
                namespace,
                key: "pb-menu",
                value: "main-menu",
                url: "https://site.com/path-1"
            },
            {
                namespace,
                key: "pb-menu",
                value: "main-menu",
                url: "https://site.com/path-2"
            },
            {
                namespace,
                key: "pb-menu",
                value: "not-main-menu",
                url: "https://site.com/random-path"
            }
        ]);

        const handlerResponse = await handler();
        expect(handlerResponse).toEqual({
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

        expect(issuedRenders).toHaveLength(1);
        expect(issuedRenders[0]).toHaveLength(3);

        expect(issuedRenders).toEqual([
            [
                {
                    url: expect.stringMatching("https://site.com/path-"),
                    configuration: {
                        meta: {
                            cloudfront: {
                                distributionId: "xyz"
                            }
                        },
                        db: {
                            namespace: "root"
                        },
                        storage: {
                            name: "s3-bucket-name",
                            folder: "test-folder"
                        }
                    }
                },
                {
                    url: expect.stringMatching("https://site.com/path-"),
                    configuration: {
                        meta: {
                            cloudfront: {
                                distributionId: "xyz"
                            }
                        },
                        db: {
                            namespace: "root"
                        },
                        storage: {
                            name: "s3-bucket-name",
                            folder: "test-folder"
                        }
                    }
                },
                {
                    url: expect.stringMatching("https://site.com/path-"),
                    configuration: {
                        meta: {
                            cloudfront: {
                                distributionId: "xyz"
                            }
                        },
                        db: {
                            namespace: "root"
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
