import { afterEach, describe, expect, it } from "vitest";
import knexLib, { type Knex } from "knex";
import { TableManager } from "~/TableManager.js";
import { SqlServiceManifestLoader, SqlServiceManifestWriter } from "~/serviceDiscovery/index.js";

const createKnex = (): Knex => {
    return knexLib({
        client: "better-sqlite3",
        connection: { filename: ":memory:" },
        useNullAsDefault: true
    });
};

describe("SqlServiceManifestWriter", () => {
    let knex: Knex | undefined;

    afterEach(async () => {
        await knex?.destroy();
        knex = undefined;
    });

    const setup = (prefix?: string) => {
        knex = createKnex();
        const tableManager = new TableManager(knex, prefix);
        return {
            writer: new SqlServiceManifestWriter(knex, tableManager),
            loader: new SqlServiceManifestLoader(knex, tableManager)
        };
    };

    const byName = (manifests: { name: string; manifest: unknown }[] | undefined) => {
        return Object.fromEntries((manifests || []).map(item => [item.name, item.manifest]));
    };

    it("stores manifests where the loader reads them", async () => {
        const { writer, loader } = setup("tenant1");

        await writer.write([
            { name: "core", manifest: { bucket: "core-bucket" } },
            { name: "api", manifest: { cloudfront: { domainName: "api.example.com" } } },
            { name: "scheduler", manifest: { arn: "arn:scheduler" } }
        ]);

        expect(byName(await loader.load())).toEqual({
            core: { bucket: "core-bucket" },
            api: { cloudfront: { domainName: "api.example.com" } },
            scheduler: { arn: "arn:scheduler" }
        });
        expect(await knex!.schema.hasTable("tenant1_webiny_service_manifests")).toBe(true);
    });

    it("updates the manifests it is given and leaves the others as they are", async () => {
        const { writer, loader } = setup();
        await writer.write([
            { name: "core", manifest: { bucket: "core-bucket" } },
            { name: "api", manifest: { url: "https://api-1" } },
            { name: "scheduler", manifest: { arn: "arn:scheduler" } }
        ]);

        await writer.write([{ name: "admin", manifest: { url: "https://admin" } }]);
        await writer.write([{ name: "api", manifest: { url: "https://api-2" } }]);

        expect(byName(await loader.load())).toEqual({
            core: { bucket: "core-bucket" },
            api: { url: "https://api-2" },
            scheduler: { arn: "arn:scheduler" },
            admin: { url: "https://admin" }
        });
    });

    it("keeps the last of two manifests with the same name", async () => {
        const { writer, loader } = setup();

        await writer.write([
            { name: "api", manifest: { url: "https://first" } },
            { name: "api", manifest: { url: "https://second" } }
        ]);

        expect(byName(await loader.load())).toEqual({ api: { url: "https://second" } });
    });

    it("writes nothing for an empty list", async () => {
        const { writer, loader } = setup();

        await writer.write([]);

        expect(await loader.load()).toBeUndefined();
    });

    it("refuses a manifest without a name or a manifest object, and stores none of the batch", async () => {
        const { writer, loader } = setup();

        await expect(
            writer.write([
                { name: "core", manifest: { bucket: "b" } },
                { name: "", manifest: {} }
            ])
        ).rejects.toThrow("A service manifest needs a `name`.");
        await expect(
            writer.write([{ name: "api", manifest: "nope" as unknown as Record<string, string> }])
        ).rejects.toThrow('The service manifest "api" needs a `manifest` object.');

        expect(await loader.load()).toBeUndefined();
    });
});
