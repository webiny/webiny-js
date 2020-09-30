import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/parallelQueries";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import { Database } from "@commodo/fields-storage-nedb";

describe("parallel queries test", () => {
    const database = new Database();

    const { environment: environmentManage } = useContentHandler({ database });
    const { environment: environmentRead } = useContentHandler({ database, type: "read" });
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should be able to run multiple queries in parallel", async () => {
        const { content, createContentModel } = environmentManage(initial.environment.id);
        const { invoke: invokeRead } = environmentRead(initial.environment.id);

        await createContentModel(
            mocks.contentModel({ contentModelGroupId: initial.contentModelGroup.id })
        );

        const products = await content("product");
        const product1 = await products.create(mocks.product1);
        const product2 = await products.create(mocks.product2);
        const product3 = await products.create(mocks.product3);

        await products.publish({ revision: product1.id });
        await products.publish({ revision: product2.id });
        await products.publish({ revision: product3.id });

        const PARALLEL_LIST_PRODUCTS = /* GraphQL */ `
            {
                cms1: listProducts {
                    data {
                        tags
                        title
                    }
                }
                cms2: listProducts {
                    data {
                        tags
                        title
                    }
                }
                cms3: listProducts {
                    data {
                        tags
                        title
                    }
                }
            }
        `;

        for (let i = 0; i < 10; i++) {
            let [response] = await invokeRead({
                body: {
                    query: PARALLEL_LIST_PRODUCTS
                }
            });

            expect(response.data.cms1.data.length).toBe(3);
            expect(response.data.cms2.data.length).toBe(3);
            expect(response.data.cms3.data.length).toBe(3);
        }
    });
});
