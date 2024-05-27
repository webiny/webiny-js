import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { Context as TasksContext } from "@webiny/tasks/types";

export * from "./tasks/CarsMock/types";

export interface Context extends CmsContext, ElasticsearchContext, TasksContext {}
