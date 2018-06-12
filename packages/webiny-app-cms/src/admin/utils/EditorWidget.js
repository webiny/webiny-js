// @flow
class EditorWidget {
    options: Object;

    constructor(options: Object = {}) {
        this.options = { ...this.options, ...options };
    }

    // eslint-disable-next-line
    removeWidget(widget: Object): Promise<mixed> {
        return Promise.resolve();
    }

    renderWidget() {
        throw new Error(`Implement "renderWidget" method in your editor widget class!`);
    }

    renderSettings() {
        return null;
    }
}

export default EditorWidget;
