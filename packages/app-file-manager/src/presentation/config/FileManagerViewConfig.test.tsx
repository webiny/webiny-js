// @vitest-environment jsdom
/**
 * An extension's `<FileManagerConfig><Browser.Table.Column … /></FileManagerConfig>`,
 * registered after the default config, must change the table's columns and nothing
 * else: `browser.table.columns` keeps the defaults (minus a removed one, with an
 * overridden one changed, plus an added one), and `browser.table.cellThumbnails`
 * stays populated. The table view maps over `browser.table.columns`, so if it goes
 * missing the File Manager crashes (webiny-js#6308).
 */
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import {
    FileManagerViewConfig,
    FileManagerViewWithConfig,
    useFileManagerConfig
} from "./FileManagerViewConfig.js";

const { Browser } = FileManagerViewConfig;

type FileManagerConfig = ReturnType<typeof useFileManagerConfig>;

const DEFAULT_COLUMNS = ["name", "type", "size", "createdBy", "createdOn", "savedOn", "actions"];

/**
 * The table part of `DefaultFileManagerConfig`, in the same order: the columns,
 * then the table cell thumbnails. The real component also registers filters,
 * actions and a feature-flagged field, which need the admin's DI container;
 * they don't touch `browser.table`.
 */
const DefaultTableConfig = () => {
    return (
        <FileManagerViewConfig>
            <Browser.Table.Column
                name={"name"}
                header={"Name"}
                cell={<span>name</span>}
                sortable={true}
                hideable={false}
                size={200}
            />
            <Browser.Table.Column name={"type"} header={"Type"} cell={<span>type</span>} />
            <Browser.Table.Column
                name={"size"}
                header={"Size"}
                cell={<span>size</span>}
                sortable={true}
            />
            <Browser.Table.Column name={"createdBy"} header={"Author"} cell={<span>author</span>} />
            <Browser.Table.Column
                name={"createdOn"}
                header={"Created"}
                cell={<span>created</span>}
                sortable={true}
            />
            <Browser.Table.Column
                name={"savedOn"}
                header={"Modified"}
                cell={<span>modified</span>}
                sortable={true}
            />
            <Browser.Table.Column
                name={"actions"}
                header={" "}
                cell={<span>actions</span>}
                size={56}
                truncate={false}
                className={"flex justify-center"}
                hideable={false}
                resizable={false}
            />
            <Browser.Table.Cell.Thumbnail type={"image/*"} element={<span>image</span>} />
            <Browser.Table.Cell.Thumbnail type={"*/*"} element={<span>file</span>} />
        </FileManagerViewConfig>
    );
};

/**
 * Wait for the PropertyStore's debounced flush, as `react-properties` tests do.
 */
async function flush() {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
    });
}

async function renderConfig(extension?: React.ReactNode): Promise<FileManagerConfig> {
    let config: FileManagerConfig | undefined;

    const Probe = () => {
        config = useFileManagerConfig();
        return null;
    };

    render(
        <CompositionProvider>
            <DefaultTableConfig />
            {extension ? <FileManagerViewConfig>{extension}</FileManagerViewConfig> : null}
            <FileManagerViewWithConfig>
                <Probe />
            </FileManagerViewWithConfig>
        </CompositionProvider>
    );

    await flush();

    if (!config) {
        throw new Error("The File Manager config was never delivered to its consumers.");
    }

    return config;
}

function columnNames(config: FileManagerConfig) {
    return config.browser.table.columns.map(column => column.name);
}

function expectThumbnails(config: FileManagerConfig) {
    expect(config.browser.table.cellThumbnails.map(thumbnail => thumbnail.type)).toEqual([
        "image/*",
        "*/*"
    ]);
}

describe("File Manager config: table columns from an extension", () => {
    afterEach(() => {
        cleanup();
    });

    it("holds the default columns when no extension changes them", async () => {
        const config = await renderConfig();

        expect(config.browser.table.columns).toBeDefined();
        expect(columnNames(config)).toEqual(DEFAULT_COLUMNS);
        expectThumbnails(config);
    });

    it("removes a default column", async () => {
        const config = await renderConfig(<Browser.Table.Column name={"actions"} remove />);

        expect(config.browser.table.columns).toBeDefined();
        expect(columnNames(config)).toEqual(DEFAULT_COLUMNS.filter(name => name !== "actions"));
        expectThumbnails(config);
    });

    it("overrides a default column", async () => {
        const config = await renderConfig(<Browser.Table.Column name={"name"} header={"Custom"} />);

        expect(config.browser.table.columns).toBeDefined();
        expect(columnNames(config)).toEqual(DEFAULT_COLUMNS);
        const name = config.browser.table.columns.find(column => column.name === "name");
        expect(name?.header).toBe("Custom");
        expectThumbnails(config);
    });

    it("adds a column alongside the defaults", async () => {
        const config = await renderConfig(
            <Browser.Table.Column name={"custom"} header={"Custom"} cell={<span>custom</span>} />
        );

        expect(config.browser.table.columns).toBeDefined();
        expect(columnNames(config)).toEqual([...DEFAULT_COLUMNS, "custom"]);
        const custom = config.browser.table.columns.find(column => column.name === "custom");
        expect(custom?.header).toBe("Custom");
        expectThumbnails(config);
    });
});
