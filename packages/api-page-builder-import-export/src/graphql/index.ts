import crud from "./crud";
import graphql from "./graphql";
import { ImportExportPluginsParams } from "~/graphql/types";
import { createTasks } from "~/tasks";

export default (params: ImportExportPluginsParams) => [crud(params), graphql, createTasks()];
