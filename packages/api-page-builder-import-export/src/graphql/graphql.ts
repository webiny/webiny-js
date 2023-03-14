import blocks from "./graphql/blocks.gql";
import forms from "./graphql/forms.gql";
import pages from "./graphql/pages.gql";
import templates from "./graphql/templates.gql";
import importExportTask from "./graphql/importExportTasks.gql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export default [blocks, forms, pages, templates, importExportTask] as GraphQLSchemaPlugin[];
