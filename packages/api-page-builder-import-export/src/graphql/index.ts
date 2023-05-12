import crud from "./crud";
import graphql from "./graphql";
import { ImportExportPluginsParams } from "~/graphql/types";

export default (params: ImportExportPluginsParams) => [crud(params), graphql];
