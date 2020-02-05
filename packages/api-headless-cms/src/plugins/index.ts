import models from "./models";
import modelFields from "./modelFields";
import graphql from "./graphql";

export default () => [models(), graphql(), modelFields];
