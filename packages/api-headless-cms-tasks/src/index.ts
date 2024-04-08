import { createEntriesTasks } from "~/tasks/entries";
import { createGraphQL } from "~/graphql";

export const createHeadlessCmsTasks = () => [createEntriesTasks(), createGraphQL()];
