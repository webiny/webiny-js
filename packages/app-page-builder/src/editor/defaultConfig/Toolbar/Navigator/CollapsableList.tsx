import React, { useState, useContext, useEffect, ReactElement } from "react";
import classNames from "classnames";
import { EmptyBlock, Collapsable, ArrowRight, HighlightItem } from "./StyledComponents";
import { NavigatorContext } from "./NavigatorDrawer";

interface CollapsableListProps {
    children: ReactElement | ReactElement[];
    header: ReactElement;
    level: number;
    disableAction: boolean;
    active: boolean;
    style?: React.CSSProperties;
    headerStyle?: React.CSSProperties;
    inActivePath: boolean;
    highlightItem: HighlightItem;
}

const CollapsableList = ({
    children,
    header,
    level,
    disableAction,
    active,
    style,
    headerStyle,
    inActivePath,
    highlightItem
}: CollapsableListProps) => {
    const [isOpen, setOpen] = useState(true);
    const { expandAll } = useContext(NavigatorContext);
    const list = Array.from(new Array(level)).map((_, i) => i);

    useEffect(() => {
        setOpen(expandAll);
    }, [expandAll]);
    // Open list item if it's in active path
    useEffect(() => {
        if (inActivePath) {
            setOpen(true);
        }
    }, [inActivePath]);

    return (
        <Collapsable className="collapsable" style={style} highlightItem={highlightItem}>
            <div
                className={classNames("collapsable__header", {
                    active: active,
                    collapsed: !isOpen
                })}
                style={headerStyle}
            >
                {list.map(i => (
                    <EmptyBlock key={i} />
                ))}
                <button
                    className={classNames(`collapsable__header-action`, {
                        disabled: disableAction
                    })}
                    onClick={() => setOpen(!isOpen)}
                >
                    <ArrowRight className={classNames({ ["open"]: isOpen })} />
                </button>
                {header}
            </div>
            <div className={`collapsable__content ${isOpen ? "" : "collapsed"}`}>
                {React.Children.map(children, (content: React.ReactElement) =>
                    React.cloneElement(content, {
                        className: "collapsable__content-item"
                    })
                )}
            </div>
        </Collapsable>
    );
};

export default CollapsableList;
