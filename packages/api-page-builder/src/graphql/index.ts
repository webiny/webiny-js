import crud from "./crud";
import graphql from "./graphql";
import prerendering from "./prerendering";
import { Configuration } from "./types";

export default (configuration: Configuration) => [crud(configuration), graphql, prerendering];
