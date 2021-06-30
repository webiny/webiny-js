import { filterItems } from "~/utils/filter";
import filters from "~/plugins/filters";
import { ContextInterface } from "@webiny/handler/types";
import { PluginsContainer } from "@webiny/plugins";
import { FieldPathPlugin } from "~/plugins/FieldPathPlugin";

const itemJohn = {
    id: 1,
    text: "john",
    meta: {
        private: true
    }
};
const itemJane = {
    id: 2,
    text: "jane",
    meta: {
        private: true
    }
};
const itemWebiny = {
    id: 3,
    text: "webiny",
    meta: {
        private: false
    }
};

const items: any[] = [itemJohn, itemJane, itemWebiny];

describe("filtering util test", () => {
    let context: ContextInterface;

    beforeEach(() => {
        context = {
            args: [],
            plugins: new PluginsContainer(),
            WEBINY_VERSION: process.env.WEBINY_VERSION
        };
        context.plugins.register(filters());
        context.plugins.register([
            new FieldPathPlugin({
                fields: ["private"],
                createPath: field => {
                    return `meta.${field}`;
                }
            })
        ]);
    });

    it("should filter by equal id", () => {
        const where = {
            id: 1
        };

        const response = filterItems({ items, where, context });

        expect(response).toEqual([itemJohn]);
    });

    it("should filter by contains", () => {
        const where = {
            text_contains: "j"
        };
        const response = filterItems({ items, where, context });

        expect(response).toEqual([itemJohn, itemJane]);
    });

    it("should filter by nested object id", () => {
        const whereFalse = {
            private: false
        };
        const responseFalse = filterItems({ items, where: whereFalse, context });

        expect(responseFalse).toEqual([itemWebiny]);

        const whereTrue = {
            private: true
        };
        const responseTrue = filterItems({ items, where: whereTrue, context });

        expect(responseTrue).toEqual([itemJohn, itemJane]);
    });
});
