// @flow
import models from "./models";
import graphql from "./graphql";
import pageContentModifiers from "./pageContentModifiers";
import pageSettings from "./pageSettings";
import ssr from "./ssr";

export default config => [
    models(config),
    ssr,
    graphql,
    pageContentModifiers(config),
    pageSettings,
];
