import { baseSchema } from "./base.gql";
import { entriesSchema } from "./entries.gql";
import { foldersSchema } from "./folders.gql";

export const graphqlPlugins = [baseSchema, entriesSchema, foldersSchema];
