import React, { useEffect } from "react";
import { CellProps } from "@webiny/ui/Grid";
import { ViewComponent } from "@webiny/ui-composer/View";
import { GenericElement } from "@webiny/ui-elements/GenericElement";
import { SplitView as SplitViewClass } from "~/views/SplitView";

const view = new SplitViewClass("split-view");

interface SplitViewProps {
    className?: string;
    children: React.ReactElement | React.ReactElement[];
}

/**
 * This component serves as a backwards-compatibility layer for older views and views created using our scaffolding 
 * tools. This ensures that the old way of constructing views internally uses the new UI Composer. 
 */
const SplitView = (props: SplitViewProps) => {
    useEffect(() => {
        React.Children.forEach(props.children, child => {
            if (child.type === LeftPanel) {
                view.getLeftPanel().setContentElement(
                    new GenericElement("leftPanelContent", () => {
                        return child.props.children;
                    })
                );
            }

            if (child.type === RightPanel) {
                view.getRightPanel().setContentElement(
                    new GenericElement("rightPanelContent", () => {
                        return child.props.children;
                    })
                );
            }
        });

        view.refresh();
    }, []);

    return <ViewComponent view={view} />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LeftPanel = (props: CellProps) => {
    return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RightPanel = (props: CellProps) => {
    return null;
};

export { SplitView, LeftPanel, RightPanel };
