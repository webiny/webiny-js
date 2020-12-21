/**
 * Plugins specific to our "site" app.
 */
import addons from "./addons";
import linkPreload from "./linkPreload";

/**
 * Page element plugins to render page content.
 */
import document from "@webiny/app-page-builder/render/plugins/elements/document";
import block from "@webiny/app-page-builder/render/plugins/elements/block";
import grid from "@webiny/app-page-builder/render/plugins/elements/grid";
import icon from "@webiny/app-page-builder/render/plugins/elements/icon";
import image from "@webiny/app-page-builder/render/plugins/elements/image";
import text from "@webiny/app-page-builder/render/plugins/elements/text";
import button from "@webiny/app-page-builder/render/plugins/elements/button";
import codepen from "@webiny/app-page-builder/render/plugins/elements/embeds/codepen";
import codesandbox from "@webiny/app-page-builder/render/plugins/elements/embeds/codesandbox";
import instagram from "@webiny/app-page-builder/render/plugins/elements/embeds/instagram";
import soundcloud from "@webiny/app-page-builder/render/plugins/elements/embeds/soundcloud";
import youtube from "@webiny/app-page-builder/render/plugins/elements/embeds/youtube";
import vimeo from "@webiny/app-page-builder/render/plugins/elements/embeds/vimeo";
import twitter from "@webiny/app-page-builder/render/plugins/elements/embeds/twitter";
import pinterest from "@webiny/app-page-builder/render/plugins/elements/embeds/pinterest";
import pagesList from "@webiny/app-page-builder/render/plugins/elements/pagesList";
import imagesList from "@webiny/app-page-builder/render/plugins/elements/imagesList";

/**
 * Page settings plugins (seo, social, etc.).
 */
import pageSettings from "@webiny/app-page-builder/render/plugins/pageSettings";

/**
 * Page element settings plugins.
 */
import align from "@webiny/app-page-builder/render/plugins/elementSettings/align";
import animation from "@webiny/app-page-builder/render/plugins/elementSettings/animation";
import background from "@webiny/app-page-builder/render/plugins/elementSettings/background";
import border from "@webiny/app-page-builder/render/plugins/elementSettings/border";
import height from "@webiny/app-page-builder/render/plugins/elementSettings/height";
import width from "@webiny/app-page-builder/render/plugins/elementSettings/width";
import shadow from "@webiny/app-page-builder/render/plugins/elementSettings/shadow";
import padding from "@webiny/app-page-builder/render/plugins/elementSettings/padding";
import margin from "@webiny/app-page-builder/render/plugins/elementSettings/margin";

export default [
    addons(),
    linkPreload(),
    // Page elements
    document(),
    block(),
    grid(),
    image(),
    icon(),
    text(),
    button(),
    codepen(),
    codesandbox(),
    instagram(),
    soundcloud(),
    youtube(),
    vimeo(),
    twitter(),
    pinterest(),
    pagesList(),
    imagesList(),
    // Page settings
    pageSettings(),
    // Page element settings
    align,
    animation,
    background,
    border,
    height,
    width,
    shadow,
    padding,
    margin
];
