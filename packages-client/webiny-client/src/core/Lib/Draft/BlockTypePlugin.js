import BasePlugin from './BasePlugin';

class BlockTypePlugin extends BasePlugin {
    constructor() {
        super();
        this.block = '';
    }

    toggleBlockType() {
        const editorState = this.editor.getEditorState();
        this.editor.setEditorState(this.Draft.RichUtils.toggleBlockType(editorState, this.block));
    }

    isActive() {
        if (this.editor.getReadOnly()) {
            return false;
        }
        return this.block === this.getStartBlockType();
    }
}

export default BlockTypePlugin;