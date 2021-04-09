import useHandler from "./useHandler";
import mocks from "./mocks/renderAllPages";

describe("Queue Processor Test", () => {
    it('should rerender all existing pages when "path: *" is present in the jobs list', async () => {
        const { handler, dynamoDbDriver, defaults } = useHandler();

        for (let i = 0; i < 3; i++) {
            await dynamoDbDriver.create({
                ...defaults.db,
                data: mocks.job(i)
            });
        }

        for (let i = 0; i < 3; i++) {
            await dynamoDbDriver.create({
                ...defaults.db,
                data: mocks.renderAllJob({ index: String(i) })
            });
        }

        // A total of six jobs must be present in the queue.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "PS#Q#JOB",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(6));

        const { data } = await handler();

        // `jobsFetchedCount` must equal to six.
        expect(data.stats.jobs.retrieved).toBe(6);
        expect(data.stats.jobs.unique).toBe(1);
        expect(data.stats.jobs.renderAll).toBe(1);
    });

    it("should have multiple render-all-pages jobs for different DB namespaces", async () => {
        const { handler, dynamoDbDriver, defaults } = useHandler();

        for (let i = 0; i < 3; i++) {
            await dynamoDbDriver.create({
                ...defaults.db,
                data: mocks.job(i)
            });
        }

        for (let i = 0; i < 3; i++) {
            await dynamoDbDriver.create({
                ...defaults.db,
                data: mocks.renderAllJob({ index: String(i) })
            });
        }

        for (let i = 0; i < 3; i++) {
            await dynamoDbDriver.create({
                ...defaults.db,
                data: mocks.renderAllJob({ index: "custom-" + i, namespace: "namespace-" + i })
            });
        }

        // A total of six jobs must be present in the queue.
        await dynamoDbDriver
            .read({
                ...defaults.db,
                query: {
                    PK: "PS#Q#JOB",
                    SK: { $gte: " " }
                }
            })
            .then(([result]) => expect(result.length).toBe(9));

        const { data } = await handler();

        expect(data.stats.jobs.retrieved).toBe(9);
        expect(data.stats.jobs.unique).toBe(4);
        expect(data.stats.jobs.renderAll).toBe(4);
    });
});
