import React, { useState, ReactElement } from "react";
import classNames from "classnames";
import { EmptyBlock, Collapsable, ArrowRight } from "./StyledComponents";

type CollapsableListProps = {
    children: ReactElement | ReactElement[];
    header: ReactElement;
    mover: ReactElement;
    level: number;
    disableAction: boolean;
    active: boolean;
    elementVisibilityAction: ReactElement;
};

const CollapsableList = ({
    children,
    header,
    mover,
    level,
    disableAction,
    active,
    elementVisibilityAction
}: CollapsableListProps) => {
    const [isOpen, setOpen] = useState(true);
    const list = Array.from(new Array(level)).map((_, i) => i);

    return (
        <Collapsable className="collapsable">
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
                {elementVisibilityAction}
                {mover}
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
