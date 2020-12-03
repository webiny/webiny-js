import contentBackground from "@webiny/app-page-builder/editor/plugins/background";
import blockEditing from "@webiny/app-page-builder/editor/plugins/blockEditing";
// Elements
import document from "@webiny/app-page-builder/editor/plugins/elements/document";
import block from "@webiny/app-page-builder/editor/plugins/elements/block";
import grid from "@webiny/app-page-builder/editor/plugins/elements/grid";
import cell from "@webiny/app-page-builder/editor/plugins/elements/cell";
import image from "@webiny/app-page-builder/editor/plugins/elements/image";
import text from "@webiny/app-page-builder/editor/plugins/elements/text";
import icon from "@webiny/app-page-builder/editor/plugins/elements/icon";
import spacer from "@webiny/app-page-builder/editor/plugins/elements/spacer";
import button from "@webiny/app-page-builder/editor/plugins/elements/button";
import media from "@webiny/app-page-builder/editor/plugins/elements/media";
import social from "@webiny/app-page-builder/editor/plugins/elements/social";
import code from "@webiny/app-page-builder/editor/plugins/elements/code";
import pagesList from "@webiny/app-page-builder/editor/plugins/elements/pagesList";
import imagesList from "@webiny/app-page-builder/editor/plugins/elements/imagesList";
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
import gridBlock from "@webiny/app-page-builder/editor/plugins/blocks/gridBlock";
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
import gridSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/grid";
// Default bar
import defaultBarPlugins from "@webiny/app-page-builder/editor/plugins/defaultBar";
// Page settings
import pageSettingsPlugins from "@webiny/app-page-builder/editor/plugins/pageSettings";
// Breadcrumbs
import breadcrumbs from "@webiny/app-page-builder/editor/plugins/breadcrumbs";
// default presets for grid
import { gridPresets } from "@webiny/app-page-builder/editor/plugins/gridPresets";
// event actions
import {
    createElementPlugin,
    deactivatePluginPlugin,
    deleteElementPlugin,
    dragPlugin,
    dropElementPlugin,
    resizePlugin,
    saveRevisionPlugin,
    togglePluginPlugin,
    updateElementPlugin,
    updatePagePlugin
} from "@webiny/app-page-builder/editor/recoil/actions";

export default [
    contentBackground,
    blockEditing,
    // Elements
    document(),
    grid,
    block(),
    gridBlock,
    ...cell(),
    icon(),
    image(),
    imagesList(),
    text(),
    spacer(),
    button(),
    media,
    social,
    code,
    pagesList(),
    // grid presets
    ...gridPresets,
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
    blocksCategories,
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
    align,
    clone,
    deleteElement,
    width,
    columnWidth,
    height,
    save,
    link,
    gridSettings,
    // Default bar
    defaultBarPlugins,
    // Page settings
    pageSettingsPlugins,
    // Breadcrumbs
    breadcrumbs,
    // action registration
    createElementPlugin(),
    updateElementPlugin(),
    togglePluginPlugin(),
    saveRevisionPlugin(),
    dropElementPlugin(),
    deactivatePluginPlugin(),
    deleteElementPlugin(),
    updatePagePlugin(),
    ...resizePlugin(),
    ...dragPlugin()
];
