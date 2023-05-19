import blocks from "./crud/blocks.crud";
import forms from "./crud/forms.crud";
import pages from "./crud/pages.crud";
import templates from "./crud/templates.crud";
import importExportTask from "./crud/importExportTasks.crud";
import { ImportExportPluginsParams } from "~/graphql/types";

export default (params: ImportExportPluginsParams) => [
    blocks,
    forms,
    pages,
    templates,
    importExportTask(params as ImportExportPluginsParams)
];
