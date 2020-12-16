import crud from "./crud";
import graphql from "./graphql";
import rendering from "./rendering";
import { Configuration } from "./types";

export default (configuration: Configuration) => [crud(configuration), graphql, rendering];
