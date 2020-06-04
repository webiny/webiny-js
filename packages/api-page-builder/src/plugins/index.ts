import models from "./models";
import graphql from "./graphql";
import pageContentModifiers from "./pageContentModifiers";
import pageSettings from "./pageSettings";

export default () => [models(), graphql, pageContentModifiers, pageSettings];
