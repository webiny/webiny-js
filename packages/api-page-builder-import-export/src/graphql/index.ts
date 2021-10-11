import crud from "./crud";
import graphql from "./graphql";
import { PageImportExportPluginsParams } from "~/graphql/types";

export default (params: PageImportExportPluginsParams) => [crud(params), graphql];
