import blocks from "./crud/blocks.crud";
import pages from "./crud/pages.crud";
import importExportTask from "./crud/importExportTasks.crud";
import { PageImportExportPluginsParams } from "~/graphql/types";

export default (params: PageImportExportPluginsParams) => [
    blocks,
    pages,
    importExportTask(params as PageImportExportPluginsParams)
];
