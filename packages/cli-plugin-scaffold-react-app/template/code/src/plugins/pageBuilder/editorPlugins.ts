import contentBackground from "@webiny/app-page-builder/editor/plugins/background";
import blockEditing from "@webiny/app-page-builder/editor/plugins/blockEditing";
// Elements
import document from "@webiny/app-page-builder/editor/plugins/elements/document";
import block from "@webiny/app-page-builder/editor/plugins/elements/block";
import grid from "@webiny/app-page-builder/editor/plugins/elements/grid";
import cell from "@webiny/app-page-builder/editor/plugins/elements/cell";
import image from "@webiny/app-page-builder/editor/plugins/elements/image";
import paragraph from "@webiny/app-page-builder/editor/plugins/elements/paragraph";
import list from "@webiny/app-page-builder/editor/plugins/elements/list";
import quote from "@webiny/app-page-builder/editor/plugins/elements/quote";
import icon from "@webiny/app-page-builder/editor/plugins/elements/icon";
import button from "@webiny/app-page-builder/editor/plugins/elements/button";
import soundcloud from "@webiny/app-page-builder/editor/plugins/elements/media/soundcloud";
import vimeo from "@webiny/app-page-builder/editor/plugins/elements/media/vimeo";
import youtube from "@webiny/app-page-builder/editor/plugins/elements/media/youtube";
import pinterest from "@webiny/app-page-builder/editor/plugins/elements/social/pinterest";
import twitter from "@webiny/app-page-builder/editor/plugins/elements/social/twitter";
import codesandbox from "@webiny/app-page-builder/editor/plugins/elements/code/codesandbox";
import pagesList from "@webiny/app-page-builder/editor/plugins/elements/pagesList";
import imagesList from "@webiny/app-page-builder/editor/plugins/elements/imagesList";
import heading from "@webiny/app-page-builder/editor/plugins/elements/heading";
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
import gridBlock from "@webiny/app-page-builder/editor/plugins/blocks/gridBlock";
// Block categories
import blocksCategories from "@webiny/app-page-builder/editor/plugins/blocksCategories";
// Toolbar
import addElement from "@webiny/app-page-builder/editor/plugins/toolbar/addElement";
import navigator from "@webiny/app-page-builder/editor/plugins/toolbar/navigator";
import saving from "@webiny/app-page-builder/editor/plugins/toolbar/saving";
import { undo, redo } from "@webiny/app-page-builder/editor/plugins/toolbar/undoRedo";
// Element settings
import advanced from "@webiny/app-page-builder/editor/plugins/elementSettings/advanced";
import animation from "@webiny/app-page-builder/editor/plugins/elementSettings/animation";
import deleteElement from "@webiny/app-page-builder/editor/plugins/elementSettings/delete";
import clone from "@webiny/app-page-builder/editor/plugins/elementSettings/clone";
import background from "@webiny/app-page-builder/editor/plugins/elementSettings/background";
import border from "@webiny/app-page-builder/editor/plugins/elementSettings/border";
import shadow from "@webiny/app-page-builder/editor/plugins/elementSettings/shadow";
import padding from "@webiny/app-page-builder/editor/plugins/elementSettings/padding";
import margin from "@webiny/app-page-builder/editor/plugins/elementSettings/margin";
import width from "@webiny/app-page-builder/editor/plugins/elementSettings/width";
import height from "@webiny/app-page-builder/editor/plugins/elementSettings/height";
import align from "@webiny/app-page-builder/editor/plugins/elementSettings/align";
import save from "@webiny/app-page-builder/editor/plugins/elementSettings/save";
import link from "@webiny/app-page-builder/editor/plugins/elementSettings/link";
import gridSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/grid";
import textSettings from "@webiny/app-page-builder/editor/plugins/elementSettings/text";
import visibility from "@webiny/app-page-builder/editor/plugins/elementSettings/visibility";
// Default bar
import defaultBarPlugins from "@webiny/app-page-builder/editor/plugins/defaultBar";
// Responsive editor mode
import responsiveEditorMode from "@webiny/app-page-builder/editor/plugins/responsiveMode";
// Page settings
import pageSettingsPlugins from "@webiny/app-page-builder/editor/plugins/pageSettings";
// Breadcrumbs
import breadcrumbs from "@webiny/app-page-builder/editor/plugins/breadcrumbs";
// default presets for grid
import { gridPresets } from "@webiny/app-page-builder/editor/plugins/gridPresets";
// event actions
import actionPlugins from "@webiny/app-page-builder/editor/recoil/actions/plugins";

export default [
    contentBackground,
    blockEditing,
    // Elements
    document(),
    grid(),
    block(),
    gridBlock,
    cell(),
    heading(),
    paragraph(),
    list(),
    quote(),
    icon(),
    image(),
    imagesList(),
    button(),
    soundcloud(),
    vimeo(),
    youtube(),
    pinterest(),
    twitter(),
    codesandbox(),
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
    // Block categories
    blocksCategories,
    // Toolbar
    addElement,
    navigator(),
    saving,
    undo,
    redo,
    // Element settings
    advanced,
    animation,
    background,
    border,
    shadow,
    padding,
    margin,
    align,
    clone,
    deleteElement,
    width,
    height,
    save,
    link,
    gridSettings,
    textSettings,
    visibility,
    // Default bar
    defaultBarPlugins,
    // Responsive editor mode
    responsiveEditorMode(),
    // Page settings
    pageSettingsPlugins,
    // Breadcrumbs
    breadcrumbs,
    // action registration
    actionPlugins()
];
