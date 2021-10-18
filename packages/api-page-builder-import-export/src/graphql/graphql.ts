import pages from "./graphql/pages.gql";
import pageImportExportTask from "./graphql/pageImportExportTasks.gql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export default [pages, pageImportExportTask] as GraphQLSchemaPlugin[];
