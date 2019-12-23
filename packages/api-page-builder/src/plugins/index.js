// @flow
import models from "./models";
import graphql from "./graphql";
import pageContentModifiers from "./pageContentModifiers";
import pageSettings from "./pageSettings";
import extendModels from "./extendModels";

export default config => [
    models(config),
    extendModels,
    graphql,
    pageContentModifiers(config),
    pageSettings,
];
