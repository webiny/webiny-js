import useHandler from "./useHandler";
import mocks from "./mocks/renderAllPages";
import mdbid from "mdbid";

describe("Render All Pages Test", () => {
    // eslint-disable-next-line
    it('should rerender all existing pages when "path: *" is present in the jobs list', async () => {
        const { handler, storageOperations } = useHandler();

        for (let i = 0; i < 3; i++) {
            await storageOperations.createQueueJob({
                queueJob: mocks.job(i)
            });
        }
        const queueJobsSimple = await storageOperations.listQueueJobs();
        expect(queueJobsSimple).toHaveLength(3);

        for (let i = 0; i < 3; i++) {
            await storageOperations.createQueueJob({
                queueJob: mocks.renderAllJob({ index: mdbid() })
            });
        }
        const queueJobsAll = await storageOperations.listQueueJobs();
        expect(queueJobsAll).toHaveLength(6);

        const queueJobsRecords = await storageOperations.listQueueJobs();
        expect(queueJobsRecords).toHaveLength(6);

        expect(await handler()).toEqual({
            data: {
                stats: {
                    jobs: {
                        renderAll: 1,
                        retrieved: 6,
                        unique: 1
                    }
                }
            },
            error: null
        });
    });

    // eslint-disable-next-line
    it("should have multiple render-all-pages jobs for different DB namespaces", async () => {
        const { handler, storageOperations } = useHandler();

        for (let i = 0; i < 3; i++) {
            await storageOperations.createQueueJob({
                queueJob: mocks.job(i)
            });
        }

        for (let i = 0; i < 3; i++) {
            await storageOperations.createQueueJob({
                queueJob: mocks.renderAllJob({ index: mdbid() })
            });
        }

        for (let i = 0; i < 3; i++) {
            await storageOperations.createQueueJob({
                queueJob: mocks.renderAllJob({ index: mdbid(), namespace: "namespace-" + i })
            });
        }

        const queueJobsRecords = await storageOperations.listQueueJobs();
        expect(queueJobsRecords).toHaveLength(9);

        expect(await handler()).toEqual({
            data: {
                stats: {
                    jobs: {
                        renderAll: 4,
                        retrieved: 9,
                        unique: 4
                    }
                }
            },
            error: null
        });
    });
});
