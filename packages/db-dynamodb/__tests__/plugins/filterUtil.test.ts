import { filterItems } from "~/utils/filter";
import filters from "~/plugins/filters";
import { ContextInterface } from "@webiny/handler/types";
import { PluginsContainer } from "@webiny/plugins";
import { FieldPlugin } from "~/plugins/definitions/FieldPlugin";

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

class TestField extends FieldPlugin {
    public static readonly type: string = "dbDynamodb.filtering.test";
}

const fields = [
    new TestField({
        field: "id"
    }),
    new TestField({
        field: "text"
    }),
    new TestField({
        field: "private",
        path: "meta.private"
    })
];

describe("filtering util test", () => {
    let context: ContextInterface;

    beforeEach(() => {
        context = {
            args: [],
            plugins: new PluginsContainer(),
            WEBINY_VERSION: process.env.WEBINY_VERSION
        };
        context.plugins.register(filters());
    });

    it("should filter by equal id", () => {
        const where = {
            id: 1
        };

        const response = filterItems({ items, where, context, fields });

        expect(response).toEqual([itemJohn]);
    });

    it("should filter by contains", () => {
        const where = {
            text_contains: "j"
        };
        const response = filterItems({ items, where, context, fields });

        expect(response).toEqual([itemJohn, itemJane]);
    });

    it("should filter by nested object id", () => {
        const whereFalse = {
            private: false
        };
        const responseFalse = filterItems({ items, where: whereFalse, context, fields });

        expect(responseFalse).toEqual([itemWebiny]);

        const whereTrue = {
            private: true
        };
        const responseTrue = filterItems({ items, where: whereTrue, context, fields });

        expect(responseTrue).toEqual([itemJohn, itemJane]);
    });
});
