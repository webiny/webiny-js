import React, { useEffect, useState } from "react";
import { CellProps } from "@webiny/ui/Grid";
import { UIViewComponent } from "@webiny/ui-composer/UIView";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { SplitView as SplitViewClass } from "~/views/SplitView";

interface SplitViewProps {
    className?: string;
    children: React.ReactElement | React.ReactElement[];
}

/**
 * This component serves as a backwards-compatibility layer for older views and views created using our scaffolding
 * tools. This ensures that the old way of constructing views internally uses the new UI Composer.
 */
const SplitView = (props: SplitViewProps) => {
    const [view, setView] = useState(null);

    useEffect(() => {
        const view = new SplitViewClass("default");
        React.Children.forEach(props.children, child => {
            if (child.type === LeftPanel) {
                if (child.props.span) {
                    view.getLeftPanel().setWidth(child.props.span);
                }
                view.getLeftPanel().setContentElement(
                    new GenericElement("leftPanelContent", () => {
                        return child.props.children;
                    })
                );

                return;
            }

            if (child.type === RightPanel) {
                if (child.props.span) {
                    view.getRightPanel().setWidth(child.props.span);
                }
                view.getRightPanel().setContentElement(
                    new GenericElement("rightPanelContent", () => {
                        return child.props.children;
                    })
                );

                return;
            }

            // Support for any other React element.
            view.addElement(
                new GenericElement(`${child.type.toString()}-${Date.now()}`, () => child)
            );
        });

        setView(view);
    }, []);

    if (!view) {
        return null;
    }

    return <UIViewComponent view={view}>{props.children}</UIViewComponent>;
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
