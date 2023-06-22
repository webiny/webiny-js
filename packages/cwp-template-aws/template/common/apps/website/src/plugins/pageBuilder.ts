/**
 * Plugins specific to the "website" app.
 */
import linkPreload from "./linkPreload";

/**
 * Ensures GraphQL's PbPage and PbPageListItem types are correctly cached.
 */
import apolloCacheObjectId from "@webiny/app-page-builder/render/plugins/apolloCacheObjectId";

/**
 * Page element plugins to render page content.
 */
import document from "@webiny/app-page-builder/render/plugins/elements/document";
import block from "@webiny/app-page-builder/render/plugins/elements/block";
import grid from "@webiny/app-page-builder/render/plugins/elements/grid";
import cell from "@webiny/app-page-builder/render/plugins/elements/cell";
import icon from "@webiny/app-page-builder/render/plugins/elements/icon";
import image from "@webiny/app-page-builder/render/plugins/elements/image";
import paragraph from "@webiny/app-page-builder/render/plugins/elements/paragraph";
import heading from "@webiny/app-page-builder/render/plugins/elements/heading";
import list from "@webiny/app-page-builder/render/plugins/elements/list";
import quote from "@webiny/app-page-builder/render/plugins/elements/quote";
import button from "@webiny/app-page-builder/render/plugins/elements/button";
import codesandbox from "@webiny/app-page-builder/render/plugins/elements/embeds/codesandbox";
import soundcloud from "@webiny/app-page-builder/render/plugins/elements/embeds/soundcloud";
import youtube from "@webiny/app-page-builder/render/plugins/elements/embeds/youtube";
import vimeo from "@webiny/app-page-builder/render/plugins/elements/embeds/vimeo";
import twitter from "@webiny/app-page-builder/render/plugins/elements/embeds/twitter";
import pinterest from "@webiny/app-page-builder/render/plugins/elements/embeds/pinterest";
import iframe from "@webiny/app-page-builder/render/plugins/elements/iframe";
import pagesList from "@webiny/app-page-builder/render/plugins/elements/pagesList";
import imagesList from "@webiny/app-page-builder/render/plugins/elements/imagesList";
import accordion from "@webiny/app-page-builder/render/plugins/elements/accordion";
import accordionItem from "@webiny/app-page-builder/render/plugins/elements/accordionItem";
import tabs from "@webiny/app-page-builder/render/plugins/elements/tabs";
import tab from "@webiny/app-page-builder/render/plugins/elements/tab";
import carousel from "@webiny/app-page-builder/render/plugins/elements/carousel";
import carouselElement from "@webiny/app-page-builder/render/plugins/elements/carouselElement";

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
import gridSettings from "@webiny/app-page-builder/render/plugins/elementSettings/grid";
import height from "@webiny/app-page-builder/render/plugins/elementSettings/height";
import width from "@webiny/app-page-builder/render/plugins/elementSettings/width";
import shadow from "@webiny/app-page-builder/render/plugins/elementSettings/shadow";
import padding from "@webiny/app-page-builder/render/plugins/elementSettings/padding";
import margin from "@webiny/app-page-builder/render/plugins/elementSettings/margin";
import textSetting from "@webiny/app-page-builder/render/plugins/elementSettings/text";
import property from "@webiny/app-page-builder/render/plugins/elementSettings/property";
import accordionSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/accordion";
import accordionItemSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/accordionItem";
import carouselSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/carousel";
import carouselElementSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/carouselElement";
import carouselStylesSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/carouselStyles";

/**
 * Responsive display mode plugins.
 */
import responsiveMode from "@webiny/app-page-builder/render/plugins/responsiveMode";

export default [
    linkPreload(),
    apolloCacheObjectId,

    // Page elements
    document(),
    block(),
    grid(),
    cell(),
    image(),
    icon(),
    paragraph(),
    heading(),
    list(),
    quote(),
    button(),
    codesandbox(),
    soundcloud(),
    youtube(),
    vimeo(),
    twitter(),
    pinterest(),
    iframe(),
    pagesList(),
    imagesList(),
    carousel(),
    carouselElement(),
    accordion(),
    accordionItem(),
    tabs(),
    tab(),
    carousel(),
    carouselElement(),

    // Page settings
    pageSettings(),

    // Page element settings
    align,
    animation,
    background,
    border,
    gridSettings,
    height,
    width,
    shadow,
    padding,
    margin,
    textSetting,
    property,
    accordionSettings,
    accordionItemSettings,
    carouselSettings,
    carouselElementSettings,
    carouselStylesSettings,
    responsiveMode()
];
