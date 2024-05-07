import React from "react";
import classNames from "classnames";
import { css } from "emotion";
import { Grid } from "@webiny/ui/Grid";
import { UIElement } from "~/ui/UIElement";
import { SplitViewPanelElement } from "./SplitView/SplitViewPanelElement";
import { UIView } from "../UIView";

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
        ".mdc-deprecated-list": {
            overflow: "auto"
        }
    },
    ">.mdc-deprecated-list": {
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
    private _classNames = new Set<string>();
    private _leftPanel?: SplitViewPanelElement;
    private _rightPanel?: SplitViewPanelElement;

    public constructor(id: string, config: SplitViewConfig = {}) {
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

    public addClassName(className: string): void {
        this._classNames.add(className);
    }

    public removeClassName(className: string): void {
        this._classNames.delete(className);
    }

    public getLeftPanel(): SplitViewPanelElement {
        return this.getElement("leftPanel") as SplitViewPanelElement;
    }

    public getRightPanel(): SplitViewPanelElement {
        return this.getElement("rightPanel") as SplitViewPanelElement;
    }

    public override render(props?: any): React.ReactNode {
        return (
            <Grid className={classNames(Array.from(this._classNames.values()))}>
                {super.render(props)}
            </Grid>
        );
    }

    private addElements(): void {
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
