import models from "./models";
import modelFields from "./modelFields";
import graphqlFields from "./graphqlFields";
import graphql from "./graphql";

export default () => [models(), graphql(), modelFields, graphqlFields];
