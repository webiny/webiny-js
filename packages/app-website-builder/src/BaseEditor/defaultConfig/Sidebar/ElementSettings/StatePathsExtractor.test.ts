import { StatePathsExtractor } from "./StatePathsExtractor";

// This test is skipped because its underlying functionality is currently not being used.
describe.skip("StatePathsExtractor", () => {
    it("extracts all paths including array indexes", () => {
        const state = {
            users: [
                { name: "Alice", age: 30 },
                { name: "Bob", age: 25 }
            ],
            settings: {
                enabled: true,
                theme: "dark"
            }
        };

        const extractor = new StatePathsExtractor(state);
        const paths = extractor.getPaths().values();

        expect(paths).toEqual(
            expect.arrayContaining([
                { value: "$state.users", label: "Users", type: "array" },
                { value: "$state.users.0", label: "Users [0]", type: "object" },
                { value: "$state.users.0.name", label: "Users [0] → Name", type: "string" },
                { value: "$state.users.0.age", label: "Users [0] → Age", type: "number" },
                { value: "$state.settings", label: "Settings", type: "object" },
                { value: "$state.settings.enabled", label: "Settings → Enabled", type: "boolean" },
                { value: "$state.settings.theme", label: "Settings → Theme", type: "string" }
            ])
        );
    });

    it("getChildPaths() returns deeply nested fields without array index", () => {
        const state = {
            users: [
                {
                    name: "Alice",
                    address: {
                        city: "NY",
                        zip: 10001
                    }
                }
            ]
        };

        const extractor = new StatePathsExtractor(state);
        const childPaths = extractor.getChildPaths("$state.users");

        expect(childPaths).toEqual([
            { value: "$.name", label: "Users → Name", type: "string" },
            { value: "$.address", label: "Users → Address", type: "object" },
            { value: "$.address.city", label: "Users → Address → City", type: "string" },
            { value: "$.address.zip", label: "Users → Address → Zip", type: "number" }
        ]);
    });

    it("getChildPaths() handles root objects", () => {
        const state = {
            settings: {
                mode: "dark",
                debug: false
            }
        };

        const extractor = new StatePathsExtractor(state);
        const childPaths = extractor.getChildPaths("$state.settings");

        expect(childPaths).toEqual([
            { value: "$.mode", label: "Settings → Mode", type: "string" },
            { value: "$.debug", label: "Settings → Debug", type: "boolean" }
        ]);
    });

    it("getChildPaths() returns empty array for primitives or undefined paths", () => {
        const state = {
            flag: true,
            count: 5
        };

        const extractor = new StatePathsExtractor(state);

        expect(extractor.getChildPaths("$state.flag")).toEqual([]);
        expect(extractor.getChildPaths("$state.count")).toEqual([]);
        expect(extractor.getChildPaths("$state.missing")).toEqual([]);
    });

    it("getChildPaths() handles arrays with non-object items", () => {
        const state = {
            tags: ["a", "b", "c"]
        };

        const extractor = new StatePathsExtractor(state);
        const childPaths = extractor.getChildPaths("$state.tags");

        expect(childPaths).toEqual([]);
    });

    it("getChildPaths() handles arrays with null or empty items", () => {
        const state = {
            logs: [null],
            events: []
        };

        const extractor = new StatePathsExtractor(state);

        expect(extractor.getChildPaths("$state.logs")).toEqual([]);
        expect(extractor.getChildPaths("$state.events")).toEqual([]);
    });
});
