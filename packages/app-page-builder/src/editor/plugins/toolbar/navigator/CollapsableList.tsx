import React, { useState, useContext, useEffect, ReactElement } from "react";
import classNames from "classnames";
import { EmptyBlock, Collapsable, ArrowRight } from "./StyledComponents";
import { NavigatorContext } from "~/editor/plugins/toolbar/navigator/Navigator";

type CollapsableListProps = {
    children: ReactElement | ReactElement[];
    header: ReactElement;
    level: number;
    disableAction: boolean;
    active: boolean;
    style?: React.CSSProperties;
};

const CollapsableList = ({
    children,
    header,
    level,
    disableAction,
    active,
    style
}: CollapsableListProps) => {
    const [isOpen, setOpen] = useState(true);
    const { expandAll } = useContext(NavigatorContext);
    const list = Array.from(new Array(level)).map((_, i) => i);

    useEffect(() => {
        setOpen(expandAll);
    }, [expandAll]);

    return (
        <Collapsable className="collapsable" style={style}>
            <div
                className={classNames("collapsable__header", {
                    active: active,
                    collapsed: !isOpen
                })}
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
                {React.Children.map(children, content =>
                    React.cloneElement(content, {
                        className: "collapsable__content-item"
                    })
                )}
            </div>
        </Collapsable>
    );
};

export default CollapsableList;
