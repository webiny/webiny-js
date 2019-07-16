// @flow
import boldFactory from "./bold";
import italicFactory from "./italic";
import underlineFactory from "./underline";
import breakFactory from "./break";
import linkFactory from "./link";
import scrollFactory from "./scroll";

const boldPlugins = boldFactory();
const italicPlugins = italicFactory();
const underlinePlugins = underlineFactory();
const linkPlugins = linkFactory();
const breakPlugins = breakFactory();
const scrollPlugins = scrollFactory();

export default [
    // Menu plugins
    boldPlugins.menu,
    italicPlugins.menu,
    underlinePlugins.menu,
    linkPlugins.menu,
    // Editor plugins
    boldPlugins.editor,
    italicPlugins.editor,
    underlinePlugins.editor,
    linkPlugins.editor,
    breakPlugins.editor,
    scrollPlugins.editor
];
