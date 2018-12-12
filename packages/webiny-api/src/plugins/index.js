// @flow
import graphqlContextEntities from "./graphqlContextEntities";
import entities from "./entities";
import graphql from "./graphql";
import generalSettings from "./settings/generalSettings";

export default [...entities, graphql, graphqlContextEntities, generalSettings];
