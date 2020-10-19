import contentBackground from "@webiny/app-page-builder/editor/plugins/background";
import blockEditing from "@webiny/app-page-builder/editor/plugins/blockEditing";
// Elements
import document from "@webiny/app-page-builder/editor/plugins/elements/document";
import row from "@webiny/app-page-builder/editor/plugins/elements//row";
import block from "@webiny/app-page-builder/editor/plugins/elements//block";
import column from "@webiny/app-page-builder/editor/plugins/elements//column";
import image from "@webiny/app-page-builder/editor/plugins/elements//image";
import text from "@webiny/app-page-builder/editor/plugins/elements//text";
import icon from "@webiny/app-page-builder/editor/plugins/elements//icon";
import spacer from "@webiny/app-page-builder/editor/plugins/elements//spacer";
import button from "@webiny/app-page-builder/editor/plugins/elements//button";
import media from "@webiny/app-page-builder/editor/plugins/elements//media";
import social from "@webiny/app-page-builder/editor/plugins/elements//social";
import code from "@webiny/app-page-builder/editor/plugins/elements//code";
import pagesList from "@webiny/app-page-builder/editor/plugins/elements//pagesList";
import imagesList from "@webiny/app-page-builder/editor/plugins/elements//imagesList";
// Icons
import icons from "@webiny/app-page-builder/editor/plugins/icons";
// Element actions
import help from "@webiny/app-page-builder/editor/plugins/elementActions/help";
// Element groups
import basicGroup from "@webiny/app-page-builder/editor/plugins/elementGroups/basic";
import layoutGroup from "@webiny/app-page-builder/editor/plugins/elementGroups/layout";
import mediaGroup from "@webiny/app-page-builder/editor/plugins/elementGroups/media";
import formGroup from "@webiny/app-page-builder/editor/plugins/elementGroups/form";
import socialGroup from "@webiny/app-page-builder/editor/plugins/elementGroups/social";
import codeGroup from "@webiny/app-page-builder/editor/plugins/elementGroups/code";
import savedGroup from "@webiny/app-page-builder/editor/plugins/elementGroups/saved";
// Blocks
import emptyBlock from "@webiny/app-page-builder/editor/plugins/blocks/emptyBlock";
// Block categories
import blocksCategories from "@webiny/app-page-builder/editor/plugins/blocksCategories";
// Toolbar
import addElement from "@webiny/app-page-builder/editor/plugins/toolbar/addElement";
import onboarding from "@webiny/app-page-builder/editor/plugins/toolbar/onboarding";
import saving from "@webiny/app-page-builder/editor/plugins/toolbar/saving";
import preview from "@webiny/app-page-builder/editor/plugins/toolbar/preview";
import { undo, redo } from "@webiny/app-page-builder/editor/plugins/toolbar/undoRedo";
// Element settings
import advanced from "@webiny/app-page-builder/editor/plugins/elementSettings/advanced";
import animation from "@webiny/app-page-builder/editor/plugins/elementSettings/animation";
import bar from "@webiny/app-page-builder/editor/plugins/elementSettings/bar";
import deleteElement from "@webiny/app-page-builder/editor/plugins/elementSettings/delete";
import clone from "@webiny/app-page-builder/editor/plugins/elementSettings/clone";
import background from "@webiny/app-page-builder/editor/plugins/elementSettings/background";
import border from "@webiny/app-page-builder/editor/plugins/elementSettings/border";
import shadow from "@webiny/app-page-builder/editor/plugins/elementSettings/shadow";
import padding from "@webiny/app-page-builder/editor/plugins/elementSettings/padding";
import margin from "@webiny/app-page-builder/editor/plugins/elementSettings/margin";
import width from "@webiny/app-page-builder/editor/plugins/elementSettings/width";
import columnWidth from "@webiny/app-page-builder/editor/plugins/elementSettings/columnWidth";
import height from "@webiny/app-page-builder/editor/plugins/elementSettings/height";
import align from "@webiny/app-page-builder/editor/plugins/elementSettings/align";
import divider from "@webiny/app-page-builder/editor/plugins/elementSettings/divider";
import save from "@webiny/app-page-builder/editor/plugins/elementSettings/save";
import link from "@webiny/app-page-builder/editor/plugins/elementSettings/link";
// Default bar
import defaultBarPlugins from "@webiny/app-page-builder/editor/plugins/defaultBar";
// Slate
import boldFactory from "@webiny/app-page-builder/editor/plugins/slate/bold";
import italicFactory from "@webiny/app-page-builder/editor/plugins/slate/italic";
import underlineFactory from "@webiny/app-page-builder/editor/plugins/slate/underline";
import listsFactory from "@webiny/app-page-builder/editor/plugins/slate/lists";
import codeFactory from "@webiny/app-page-builder/editor/plugins/slate/code";
import breakFactory from "@webiny/app-page-builder/editor/plugins/slate/break";
import blockFactory from "@webiny/app-page-builder/editor/plugins/slate/block";
import linkFactory from "@webiny/app-page-builder/editor/plugins/slate/link";
import scrollFactory from "@webiny/app-page-builder/editor/plugins/slate/scroll";
// Page settings
import pageSettingsPlugins from "@webiny/app-page-builder/editor/plugins/pageSettings";
// Breadcrumbs
import breadcrumbs from "@webiny/app-page-builder/editor/plugins/breadcrumbs";

const blockPlugins = blockFactory();
const boldPlugins = boldFactory();
const italicPlugins = italicFactory();
const underlinePlugins = underlineFactory();
const codePlugins = codeFactory();
const linkPlugins = linkFactory();
const listsPlugins = listsFactory();
const breakPlugins = breakFactory();
const scrollPlugins = scrollFactory();

export default [
    contentBackground,
    blockEditing,
    // Elements
    document(),
    row(),
    block(),
    column(),
    ...icon(),
    ...image(),
    ...imagesList(),
    text(),
    spacer(),
    ...button(),
    ...media,
    ...social,
    ...code,
    ...pagesList(),
    // Icons
    icons,
    // Element Actions
    help,
    // Element groups
    basicGroup,
    formGroup,
    layoutGroup,
    mediaGroup,
    socialGroup,
    codeGroup,
    savedGroup,
    // Blocks
    emptyBlock,
    // Block categories
    ...blocksCategories,
    // Toolbar
    addElement,
    preview,
    saving,
    onboarding,
    undo,
    redo,
    // Element settings
    advanced,
    animation,
    bar,
    divider,
    background,
    border,
    shadow,
    padding,
    margin,
    ...align,
    clone,
    deleteElement,
    width,
    columnWidth,
    height,
    save,
    link,
    // Default bar
    ...defaultBarPlugins,
    // Slate Menu plugins
    blockPlugins.menu,
    boldPlugins.menu,
    italicPlugins.menu,
    underlinePlugins.menu,
    codePlugins.menu,
    linkPlugins.menu,
    listsPlugins.menu,
    // Slate Editor plugins
    boldPlugins.editor,
    italicPlugins.editor,
    underlinePlugins.editor,
    codePlugins.editor,
    listsPlugins.editor,
    linkPlugins.editor,
    breakPlugins.editor,
    blockPlugins.editor,
    scrollPlugins.editor,
    // Page settings
    ...pageSettingsPlugins,
    // Breadcrumbs
    breadcrumbs
];
