// @flow
import boldFactory from "./bold";
import italicFactory from "./italic";
import underlineFactory from "./underline";
import listsFactory from "./lists";
import breakFactory from "./break";
import blockFactory from "./block";
import linkFactory from "./link";
import scrollFactory from "./scroll";

const blockPlugins = blockFactory();
const boldPlugins = boldFactory();
const italicPlugins = italicFactory();
const underlinePlugins = underlineFactory();
const linkPlugins = linkFactory();
const listsPlugins = listsFactory();
const breakPlugins = breakFactory();
const scrollPlugins = scrollFactory();

export default [
    // Menu plugins
    blockPlugins.menu,
    boldPlugins.menu,
    italicPlugins.menu,
    underlinePlugins.menu,
    linkPlugins.menu,
    listsPlugins.menu,
    // Editor plugins
    boldPlugins.editor,
    italicPlugins.editor,
    underlinePlugins.editor,
    listsPlugins.editor,
    linkPlugins.editor,
    breakPlugins.editor,
    blockPlugins.editor,
    scrollPlugins.editor
];
