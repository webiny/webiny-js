// @flow
import * as React from "react";
import { connect } from "react-redux";
import { isEqual } from "lodash";
import { css } from "emotion";
import { getActiveElement, getElement } from "webiny-app-cms/editor/selectors";
import { activateElement, highlightElement } from "webiny-app-cms/editor/actions";

const breadcrumbs = css({
    display: "flex",
    flexDirection: "row",
    padding: 5,
    position: "fixed",
    left: 60,
    bottom: 0,
    "> li": {
        cursor: "pointer"
    }
});

const Breadcrumbs = ({ elements, activateElement, highlightElement }: Object) => {
    if (!elements) {
        return null;
    }

    return (
        <ul className={breadcrumbs}>
            {elements.map((el, index) => (
                <li
                    key={el.id}
                    onMouseOver={() => highlightElement({ element: el.id })}
                    onClick={() => activateElement({ element: el.id })}
                >
                    {el.type.replace("cms-element-", "")}[{el.index}]
                    {elements.length - 1 > index ? <span>&nbsp;>&nbsp;</span> : null}
                </li>
            ))}
        </ul>
    );
};

export default connect(
    state => {
        const element = getActiveElement(state);
        if (!element) {
            return { elements: null };
        }

        const paths = element.path.split(".").slice(1);
        const elements = paths.map((path, index) => {
            const elPath = [0, ...paths.slice(0, index + 1)].join(".");
            const el = getElement(state, elPath);
            return { id: el.id, type: el.type, index: path, active: el.id === element.id };
        });

        return { elements };
    },
    { activateElement, highlightElement },
    null,
    { areStatePropsEqual: isEqual }
)(Breadcrumbs);
