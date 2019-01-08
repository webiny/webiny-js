// @flow
import contentBackground from "./../plugins/background";
import blockEditing from "./../plugins/blockEditing";
import elements from "./../plugins/elements";
import elementActions from "./../plugins/elementActions";
import elementGroups from "./../plugins/elementGroups";
import blocks from "./../plugins/blocks";
import blocksCategories from "./../plugins/blocksCategories";
import toolbar from "./../plugins/toolbar";
import elementSettings from "./../plugins/elementSettings";
import defaultBarPlugins from "./../plugins/defaultBar";
import slateEditorPlugins from "./../plugins/slate";
import pageSettingsPlugins from "./../plugins/pageSettings";
import breadcrumbs from "./../plugins/breadcrumbs";

export default [
    contentBackground,
    breadcrumbs,
    ...elementActions,
    ...elementGroups,
    ...blockEditing,
    ...elements,
    ...blocks,
    ...blocksCategories,
    ...toolbar,
    ...elementSettings,
    ...defaultBarPlugins,
    ...slateEditorPlugins,
    ...pageSettingsPlugins
];
