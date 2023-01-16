import blocks from "./graphql/blocks.gql";
import pages from "./graphql/pages.gql";
import importExportTask from "./graphql/importExportTasks.gql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export default [blocks, pages, importExportTask] as GraphQLSchemaPlugin[];
