import useHandler from "./useHandler";
import mocks from "./mocks/jobsRemoval";

describe("Jobs Removal Test", () => {
    it("on each run, all jobs should be removed from the database", async () => {
        const { handler, storageOperations } = useHandler();

        for (let i = 0; i < 3; i++) {
            await storageOperations.createQueueJob({
                queueJob: mocks.job(String(i))
            });
        }

        /**
         * A total of three jobs must be present in the queue.
         */
        const queueJobsRecords = await storageOperations.listQueueJobs();
        expect(queueJobsRecords).toHaveLength(3);

        expect(await handler()).toEqual({
            data: {
                stats: {
                    jobs: {
                        renderAll: 0,
                        retrieved: 3,
                        unique: 3
                    }
                }
            },
            error: null
        });

        const queueJobsRecordsNone = await storageOperations.listQueueJobs();
        expect(queueJobsRecordsNone).toHaveLength(0);
    });
});
