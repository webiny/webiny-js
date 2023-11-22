import useHandler from "./useHandler";
import createRenderEntry from "./mocks/createRenderEntry";
import createTagLinkEntry from "./mocks/createTagLinkEntry";
import createQueueJobEntry from "./mocks/createQueueJobEntry";
import { Render, RenderEvent, TagPathLink } from "~/types";
import { LambdaContext } from "@webiny/handler-aws/types";

const tenant = "root";
const locale = "en-US";

describe("Render Pages Test", () => {
    it("should render all pages with a specific tag", async () => {
        /**
         * With this section, we are intercepting all render handler invocations, and inspecting the passed args.
         */
        const issuedRenders: RenderEvent[][] = [];
        const { handler, storageOperations } = useHandler({
            type: "handler-client-handler-render-handler",
            name: "handler-client-handler-render-handler",
            invoke(args: RenderEvent[]) {
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

        const path = `/random-path`;

        const render: Render = {
            tenant,
            locale,
            path,
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
                tenant
            }
        });
        expect(renderers).toEqual([render]);

        const tagPathLinks: TagPathLink[] = tags.map(tag => {
            return {
                ...tag,
                path,
                tenant
            };
        });

        await storageOperations.createTagPathLinks({
            tagPathLinks
        });

        const listPbPageTagPathLinks = await storageOperations.listTagPathLinks({
            where: {
                tenant,
                tag: {
                    key: "pb-page"
                }
            }
        });
        expect(listPbPageTagPathLinks).toHaveLength(1);

        const listPbMenuTagPathLinks = await storageOperations.listTagPathLinks({
            where: {
                tenant,
                tag: {
                    key: "pb-menu"
                }
            }
        });
        expect(listPbMenuTagPathLinks).toHaveLength(1);
        /**
         * 2. Now, let's create three render entries with the `{ value: "main-menu", key: "pb-menu" }` tag. Note
         * that once we've created those, we area also creating a tag-url link for every tag in the render entry.
         */
        for (let i = 0; i < 3; i++) {
            const path = `/path-${i}`;
            const tags = [
                { value: `page-id-${i}`, key: "pb-page" },
                { value: "main-menu", key: "pb-menu" }
            ];

            await storageOperations.createRender({
                render: createRenderEntry({
                    locale,
                    tenant,
                    path,
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

            await storageOperations.createTagPathLinks({
                tagPathLinks: tags.map(tag => {
                    return createTagLinkEntry({
                        path,
                        tenant,
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
                    locale,
                    tenant,
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
                    locale,
                    tenant,
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
                tenant
            }
        });
        expect(renderRecords).toHaveLength(4);
        expect(renderRecords).toMatchObject([
            {
                tenant,
                path: "/path-0"
            },
            {
                tenant,
                path: "/path-1"
            },
            {
                tenant,
                path: "/path-2"
            },
            {
                tenant,
                path: "/random-path"
            }
        ]);

        /**
         * 6.3. A total of four "pb-page" tag-url link entries must be present.
         */
        const tagPathLinkPbPageRecords = await storageOperations.listTagPathLinks({
            where: {
                tenant,
                tag: {
                    key: "pb-page"
                }
            }
        });
        expect(tagPathLinkPbPageRecords).toHaveLength(4);
        expect(tagPathLinkPbPageRecords).toEqual([
            {
                tenant,
                key: "pb-page",
                value: "page-id-0",
                path: "/path-0"
            },
            {
                tenant,
                key: "pb-page",
                value: "page-id-1",
                path: "/path-1"
            },
            {
                tenant,
                key: "pb-page",
                value: "page-id-2",
                path: "/path-2"
            },
            {
                tenant,
                key: "pb-page",
                value: "page-random-id",
                path: "/random-path"
            }
        ]);

        /**
         * 6.4. A total of four "pb-menu" tags must be present in the queue.
         */
        const tagPathLinkPbMenuRecords = await storageOperations.listTagPathLinks({
            where: {
                tenant,
                tag: {
                    key: "pb-menu"
                }
            }
        });
        expect(tagPathLinkPbMenuRecords).toHaveLength(4);
        expect(tagPathLinkPbMenuRecords).toEqual([
            {
                tenant,
                key: "pb-menu",
                value: "main-menu",
                path: "/path-0"
            },
            {
                tenant,
                key: "pb-menu",
                value: "main-menu",
                path: "/path-1"
            },
            {
                tenant,
                key: "pb-menu",
                value: "main-menu",
                path: "/path-2"
            },
            {
                tenant,
                key: "pb-menu",
                value: "not-main-menu",
                path: "/random-path"
            }
        ]);

        const handlerResponse = await handler({}, {} as LambdaContext);
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

        expect(issuedRenders.map(batch => batch.map(render => ({ path: render.path })))).toEqual([
            [
                {
                    path: expect.stringMatching("/path-")
                },
                {
                    path: expect.stringMatching("/path-")
                },
                {
                    path: expect.stringMatching("/path-")
                }
            ]
        ]);
    });
});
