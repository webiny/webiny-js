import {Webiny} from 'webiny-client';

class TableShortcuts extends Webiny.Draft.BasePlugin {
    constructor(config) {
        super(config);
        this.name = 'insert-table-row';
    }

    getEditConfig() {
        return {
            handleKeyCommand: (command) => {
                if (command === 'insert-table-row') {
                    this.config.insertRow();
                    return true;
                }

                if (command === 'delete-table-row') {
                    this.config.deleteRow();
                    return true;
                }
            },

            keyBindingFn: (e) => {
                if (!this.editor.getEditorState().getSelection().isCollapsed()) {
                    return false;
                }

                if (this.Draft.KeyBindingUtil.hasCommandModifier(e)) {
                    switch (e.keyCode) {
                        // Cmd + D
                        case 68:
                            return 'insert-table-row';
                        // Cmd + X
                        case 88:
                            return 'delete-table-row';
                        default:
                            return false;
                    }
                }
            }
        };
    }
}

export default TableShortcuts;