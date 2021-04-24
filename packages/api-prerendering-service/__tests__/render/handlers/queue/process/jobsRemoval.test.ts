import useHandler from "./useHandler";
import mocks from "./mocks/jobsRemoval";

describe("Jobs Removal Test", () => {
    it("on each run, all jobs should be removed from the database", async () => {
        const { handler, dynamoDbDriver, defaults } = useHandler();

        for (let i = 0; i < 3; i++) {
            await dynamoDbDriver.create({
                ...defaults.db,
                data: mocks.job(i)
            });
        }

        // A total of three jobs must be present in the queue.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "PS#Q#JOB",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(3));

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

        // Finally, no jobs should be returned.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "PS#Q#JOB",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(0));
    });
});
