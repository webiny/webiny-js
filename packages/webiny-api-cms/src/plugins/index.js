// @flow
import general from "./pageSettings/general";
import seo from "./pageSettings/seo";
import social from "./pageSettings/social";
import entities from "./entities";
import settings from "./settings";
import graphql from "./graphql";
import pageContentModifiers from "./entities/pageContentModifiers";

export default [general, seo, social, entities, graphql, settings, pageContentModifiers];
