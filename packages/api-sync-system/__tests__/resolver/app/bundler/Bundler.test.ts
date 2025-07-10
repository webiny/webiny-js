import { Bundler, createBundler } from "~/resolver/app/bundler/Bundler.js";
import { createBundles } from "~/resolver/app/bundler/Bundles";
import { BaseBundle } from "~/resolver/app/bundler/BaseBundle.js";
import { createMockDeployment } from "~tests/mocks/deployments.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import type { IIngestorResultItem } from "~/resolver/app/ingestor/types.js";
import { CommandBundle, createCommandBundle } from "~/resolver/app/bundler/CommandBundle.js";
import { createTableBundle, TableBundle } from "~/resolver/app/bundler/TableBundle.js";

class MockBundle extends BaseBundle {
    public override canAdd(item: IIngestorResultItem): boolean {
        return (
            item.command === this.command &&
            item.source.name === this.source.name &&
            this.table.name === item.table.name
        );
    }
}

describe("Bundler", () => {
    it("should create bundler", () => {
        const bundler = createBundler({
            createBundles: () => {
                return createBundles({
                    createBundle: item => {
                        return new MockBundle({
                            command: item.command,
                            table: item.table,
                            source: item.source
                        });
                    }
                });
            }
        });

        expect(bundler).toBeInstanceOf(Bundler);
    });

    it("should bundle items", () => {
        const bundler = createBundler({
            createBundles: () => {
                return createBundles({
                    createBundle: item => {
                        return new MockBundle({
                            command: item.command,
                            table: item.table,
                            source: item.source
                        });
                    }
                });
            }
        });

        const table = createRegularMockTable();
        const source = createMockDeployment();

        const item: IIngestorResultItem = {
            command: "put",
            PK: "pk1",
            SK: "sk1",
            table,
            source
        };

        const bundles = bundler.bundle({
            items: [item]
        });

        expect(bundles.getBundles()).toHaveLength(1);

        const bundle = bundles.getBundles()[0];

        expect(bundle.table).toEqual(table);
        expect(bundle.source).toEqual(source);

        expect(bundle.items).toHaveLength(1);

        expect(bundle.items[0]).toEqual({
            PK: item.PK,
            SK: item.SK
        });

        const item2: IIngestorResultItem = {
            command: "put",
            PK: "pk2",
            SK: "sk2",
            table,
            source
        };

        const item3: IIngestorResultItem = {
            command: "delete",
            PK: "pk3",
            SK: "sk3",
            table,
            source
        };

        const item4: IIngestorResultItem = {
            command: "put",
            PK: "pk4",
            SK: "sk4",
            table,
            source
        };

        const item5: IIngestorResultItem = {
            command: "put",
            PK: "pk5",
            SK: "sk5",
            table,
            source
        };

        const secondBundle = bundler.bundle({
            items: [item2, item3, item4, item5]
        });

        expect(secondBundle.getBundles()).toHaveLength(3);
    });

    it("should bundle items by command", () => {
        const bundler = createBundler({
            createBundles: () => {
                return createBundles({
                    createBundle: item => {
                        return createCommandBundle({
                            command: item.command,
                            table: item.table,
                            source: item.source
                        });
                    }
                });
            }
        });

        const table = createRegularMockTable();
        const source = createMockDeployment();

        const item1: IIngestorResultItem = {
            command: "put",
            PK: "pk1",
            SK: "sk1",
            table,
            source
        };

        const item2: IIngestorResultItem = {
            command: "put",
            PK: "pk2",
            SK: "sk2",
            table,
            source
        };

        const item3: IIngestorResultItem = {
            command: "delete",
            PK: "pk3",
            SK: "sk3",
            table,
            source
        };

        const item4: IIngestorResultItem = {
            command: "put",
            PK: "pk4",
            SK: "sk4",
            table,
            source
        };

        const item5: IIngestorResultItem = {
            command: "put",
            PK: "pk5",
            SK: "sk5",
            table,
            source
        };

        const bundeled = bundler.bundle({
            items: [item1, item2, item3, item4, item5]
        });

        const bundles = bundeled.getBundles();

        expect(bundles).toHaveLength(3);
        expect(bundles[0]).toBeInstanceOf(CommandBundle);
        expect(bundles[1]).toBeInstanceOf(CommandBundle);
        expect(bundles[2]).toBeInstanceOf(CommandBundle);

        expect(bundles[0].items).toHaveLength(2);
        expect(bundles[1].items).toHaveLength(1);
        expect(bundles[2].items).toHaveLength(2);
    });

    it("should bundle items by table", () => {
        const bundler = createBundler({
            createBundles: () => {
                return createBundles({
                    createBundle: item => {
                        return createTableBundle({
                            command: item.command,
                            table: item.table,
                            source: item.source
                        });
                    }
                });
            }
        });

        const table = createRegularMockTable();
        const source = createMockDeployment();

        const item1: IIngestorResultItem = {
            command: "put",
            PK: "pk1",
            SK: "sk1",
            table,
            source
        };

        const item2: IIngestorResultItem = {
            command: "put",
            PK: "pk2",
            SK: "sk2",
            table,
            source
        };

        const item3: IIngestorResultItem = {
            command: "delete",
            PK: "pk3",
            SK: "sk3",
            table,
            source
        };

        const item4: IIngestorResultItem = {
            command: "put",
            PK: "pk4",
            SK: "sk4",
            table,
            source
        };

        const item5: IIngestorResultItem = {
            command: "put",
            PK: "pk5",
            SK: "sk5",
            table,
            source
        };

        const bundeled = bundler.bundle({
            items: [item1, item2, item3, item4, item5]
        });

        const bundles = bundeled.getBundles();

        expect(bundles).toHaveLength(1);
        expect(bundles[0]).toBeInstanceOf(TableBundle);

        expect(bundles[0].items).toHaveLength(5);
    });
});
