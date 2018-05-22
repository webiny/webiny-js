class EditorWidget {
    constructor() {
        // Here for future upgrades
    }

    makeLocal({ widget }) {
        return Promise.resolve(widget);
    }

    // eslint-disable-next-line
    removeWidget(widget) {
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
