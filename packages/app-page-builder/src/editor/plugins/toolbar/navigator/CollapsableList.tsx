import React, { useState, ReactElement } from "react";
import classNames from "classnames";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as VisibilityOffIcon } from "~/editor/assets/icons/visibility_off_24px.svg";
import { EmptyBlock, Collapsable, ArrowRight } from "./StyledComponents";

type CollapsableListProps = {
    children: ReactElement | ReactElement[];
    header: ReactElement;
    level: number;
    disableAction: boolean;
    active: boolean;
    hidden: boolean;
};

const CollapsableList = ({
    children,
    header,
    level,
    disableAction,
    active,
    hidden
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
                {hidden && (
                    <Icon icon={<VisibilityOffIcon />} className={"collapsable__header-icon"} />
                )}
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
