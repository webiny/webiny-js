import React from "react";
import classNames from "classnames";
import { css } from "emotion";
import { Grid } from "@webiny/ui/Grid";
import { UIView } from "@webiny/ui-composer/UIView";
import { UIElement } from "@webiny/ui-composer/UIElement";
import { SplitViewPanelElement } from "./SplitView/SplitViewPanelElement";

const grid = css({
    "&.mdc-layout-grid": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-background)",
        ">.mdc-layout-grid__inner": {
            gridGap: 0
        }
    }
});

const leftPanel = css({
    backgroundColor: "var(--mdc-theme-surface)",
    ">.webiny-data-list": {
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 70px)",
        ".mdc-list": {
            overflow: "auto"
        }
    },
    ">.mdc-list": {
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 70px)",
        overflow: "auto"
    }
});

const rightPanel = css({
    backgroundColor: "var(--mdc-theme-background)",
    overflow: "auto",
    height: "calc(100vh - 70px)"
});

interface SplitViewConfig {
    leftPanel?: UIElement;
    rightPanel?: UIElement;
}

export class SplitView extends UIView {
    private _classNames = new Set();
    private _leftPanel: SplitViewPanelElement;
    private _rightPanel: SplitViewPanelElement;

    constructor(id, config: SplitViewConfig = {}) {
        super(`SplitView.${id}`);

        this.useGrid(false);
        this.addClassName(grid);
        this.addClassName("webiny-split-view");
        this.addElements();

        if (config.leftPanel) {
            this.getLeftPanel().addElement(config.leftPanel);
        }

        if (config.rightPanel) {
            this.getRightPanel().addElement(config.rightPanel);
        }
    }

    addClassName(className: string) {
        this._classNames.add(className);
    }

    removeClassName(className: string) {
        this._classNames.delete(className);
    }

    getLeftPanel(): SplitViewPanelElement {
        return this.getElement("leftPanel");
    }

    getRightPanel(): SplitViewPanelElement {
        return this.getElement("rightPanel");
    }

    render(props?: any): React.ReactNode {
        return (
            <Grid className={classNames(Array.from(this._classNames.values()))}>
                {super.render(props)}
            </Grid>
        );
    }

    private addElements() {
        this._leftPanel = new SplitViewPanelElement("leftPanel");
        this._leftPanel.useGrid(false);
        this._leftPanel.setWidth(5);
        this._leftPanel.addClassName(leftPanel);
        this._leftPanel.addClassName("webiny-split-view__left-panel");

        this._rightPanel = new SplitViewPanelElement("rightPanel");
        this._rightPanel.useGrid(false);
        this._rightPanel.setWidth(7);
        this._rightPanel.addClassName(rightPanel);
        this._rightPanel.addClassName("webiny-split-view__right-panel");

        this.addElement(this._leftPanel);
        this._rightPanel.moveAfter(this._leftPanel);
    }
}
