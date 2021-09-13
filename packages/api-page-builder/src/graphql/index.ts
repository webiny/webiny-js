import crud from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";
import prerendering from "./prerendering";

export default () => [crud, graphql, upgrades(), prerendering];
