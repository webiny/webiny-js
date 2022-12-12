import blocks from "./crud/blocks.crud";
import pages from "./crud/pages.crud";
import importExportTask from "./crud/importExportTasks.crud";
import { ImportExportPluginsParams } from "~/graphql/types";

export default (params: ImportExportPluginsParams) => [
    blocks,
    pages,
    importExportTask(params as ImportExportPluginsParams)
];
