import contentBackground from "./../plugins/editor/background";
import blockEditing from "./../plugins/editor/blockEditing";
import elements from "./../plugins/editor/elements";
import elementGroups from "./../plugins/editor/elementGroups";
import blocks from "./../plugins/editor/blocks";
import toolbar from "./../plugins/editor/toolbar";
import elementSettings from "./../plugins/editor/elementSettings";
import defaultBarPlugins from "./../plugins/editor/defaultBar";
import slateEditorPlugins from "./../plugins/editor/slate";
import previewPlugins from "./../plugins/editor/preview";

export default [
    contentBackground,
    ...elementGroups,
    ...blockEditing,
    ...elements,
    ...blocks,
    ...toolbar,
    ...elementSettings,
    ...defaultBarPlugins,
    ...slateEditorPlugins,
    ...previewPlugins
];
