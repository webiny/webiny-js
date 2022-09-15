import { baseSchema } from "./base.gql";
import { linksSchema } from "./links.gql";
import { foldersSchema } from "./folders.gql";

export const graphqlPlugins = [baseSchema, linksSchema, foldersSchema];
