import pages from "./crud/pages.crud";
import pageImportExportTask from "./crud/pageImportExportTasks.crud";
import { PageImportExportPluginsParams } from "~/graphql/types";

export default (params: PageImportExportPluginsParams) => [pages, pageImportExportTask(params)];
