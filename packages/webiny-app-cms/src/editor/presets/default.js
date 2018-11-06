import contentBackground from "./../plugins/background";
import blockEditing from "./../plugins/blockEditing";
import elements from "./../plugins/elements";
import elementActions from "./../plugins/elementActions";
import elementGroups from "./../plugins/elementGroups";
import blocks from "./../plugins/blocks";
import toolbar from "./../plugins/toolbar";
import elementSettings from "./../plugins/elementSettings";
import defaultBarPlugins from "./../plugins/defaultBar";
import slateEditorPlugins from "./../plugins/slate";

export default [
    contentBackground,
    ...elementActions,
    ...elementGroups,
    ...blockEditing,
    ...elements,
    ...blocks,
    ...toolbar,
    ...elementSettings,
    ...defaultBarPlugins,
    ...slateEditorPlugins
];
