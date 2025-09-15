import { describe, expect, it } from "vitest";
import { SourceDataContainer } from "~/resolver/app/data/SourceDataContainer.js";
import type { IInputItem } from "~/resolver/app/data/types.js";
import { createMockSourceDeployment } from "~tests/mocks/deployments.js";
import { createRegularMockTable } from "~tests/mocks/table.js";

describe("SourceDataContainer", () => {
    const table = createRegularMockTable();
    const source = createMockSourceDeployment();

    const item1: IInputItem = Object.freeze({
        source,
        table,
        PK: "pk1",
        SK: "sk1"
    });
    const item2: IInputItem = Object.freeze({
        source,
        table,
        PK: "pk2",
        SK: "sk2"
    });

    it("should create a source data container", () => {
        const container = SourceDataContainer.create();

        expect(container).toBeInstanceOf(SourceDataContainer);
    });

    it("should have no items in the container", () => {
        const container = SourceDataContainer.create();

        expect(Object.keys(container.items)).toHaveLength(0);
        expect(container.items).toEqual({});

        expect(
            container.get({
                PK: "PK",
                SK: "SK",
                table,
                source
            })
        ).toBeNull();
    });

    it("should add items to the container", () => {
        const container = SourceDataContainer.create();

        container.add(item1, {
            PK: item1.PK,
            SK: item1.SK,
            nothing: true
        });
        /**
         * Should not add a second item with the same PK and SK.
         */
        container.add(item1, {
            PK: item1.PK,
            SK: item1.SK,
            nothing: true
        });

        container.add(item2, {
            PK: item2.PK,
            SK: item2.SK,
            nothing: false
        });

        expect(Object.keys(container.items)).toHaveLength(2);

        expect(container.get(item1)).toEqual({
            PK: item1.PK,
            SK: item1.SK,
            nothing: true
        });
        expect(container.get(item2)).toEqual({
            PK: item2.PK,
            SK: item2.SK,
            nothing: false
        });
    });

    it("should merge two containers into one", () => {
        const container1 = SourceDataContainer.create();
        const container2 = SourceDataContainer.create();

        container1.add(item1, {
            PK: item1.PK,
            SK: item1.SK,
            nothing: true
        });
        container2.add(item2, {
            PK: item2.PK,
            SK: item2.SK,
            nothing: false
        });

        container1.merge(container2);
        expect(Object.keys(container1.items)).toHaveLength(2);
        expect(container1.get(item1)).toEqual({
            PK: item1.PK,
            SK: item1.SK,
            nothing: true
        });
        expect(container1.get(item2)).toEqual({
            PK: item2.PK,
            SK: item2.SK,
            nothing: false
        });

        expect(Object.keys(container2.items)).toHaveLength(1);

        expect(container2.get(item1)).toEqual(null);
        expect(container2.get(item2)).toEqual({
            PK: item2.PK,
            SK: item2.SK,
            nothing: false
        });
    });
});
