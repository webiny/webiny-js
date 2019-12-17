// @flow
import models from "./models";
import graphql from "./graphql";
import pageContentModifiers from "./pageContentModifiers";
import pageSettings from "./pageSettings";
import pagePublish from "./pagePublish";

export default config => [
    models(config),
    graphql,
    pageContentModifiers(config),
    pageSettings,
    pagePublish
];
