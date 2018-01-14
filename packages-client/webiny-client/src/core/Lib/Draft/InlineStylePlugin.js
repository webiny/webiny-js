import BasePlugin from './BasePlugin';

class InlineStylePlugin extends BasePlugin {
    constructor(config) {
        super(config);
        this.style = '';
    }

    toggleStyle(style = this.style) {
        const Draft = this.Draft;
        const editorState = this.editor.getEditorState();
        const contentState = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        if (this.isActive() && selection.isCollapsed()) {
            // Create a selection by finding style ranges from current cursor position
            let newEntityState = contentState;
            // Find relevant styles and remove them
            contentState.getBlockForKey(selection.getAnchorKey()).findStyleRanges(c => c.style.has(style), (start, end) => {
                if (start < selection.getAnchorOffset() && end > selection.getAnchorOffset()) {
                    const inlineStyleRange = new Draft.SelectionState({
                        anchorOffset: start,
                        anchorKey: selection.getAnchorKey(),
                        focusOffset: end,
                        focusKey: selection.getAnchorKey(),
                        isBackward: false,
                        hasFocus: selection.getHasFocus()
                    });
                    newEntityState = Draft.Modifier.removeInlineStyle(editorState.getCurrentContent(), inlineStyleRange, style);
                }
            });
            this.editor.setEditorState(Draft.EditorState.createWithContent(newEntityState, this.editor.getDecorators()));
        } else {
            this.editor.setEditorState(Draft.RichUtils.toggleInlineStyle(editorState, style));
        }
    }

    isActive() {
        if (this.editor.getReadOnly()) {
            return false;
        }

        const editorState = this.editor.getEditorState();
        const selection = editorState.getSelection();

        if (selection.isCollapsed()) {
            const block = this.getStartBlock();
            if (block) {
                return block.getInlineStyleAt(selection.getAnchorOffset()).has(this.style);
            }
            return null;
        }
        return editorState.getCurrentInlineStyle().has(this.style);
    }
}

export default InlineStylePlugin;