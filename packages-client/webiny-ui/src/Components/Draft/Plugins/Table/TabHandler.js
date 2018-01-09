import {Webiny} from 'webiny-client';

class TabHandler extends Webiny.Draft.BasePlugin {
    constructor(config) {
        super(config);
    }

    getEditConfig() {
        return {
            onTab: (e) => {
                if (!this.editor.getReadOnly()) {
                    return e.shiftKey ? this.config.selectPrevEditor() : this.config.selectNextEditor();
                }
            }
        };
    }
}

export default TabHandler;