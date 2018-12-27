// @flow
import * as React from "react";
import { connect } from "react-redux";
import { isEqual } from "lodash";
import { css } from "emotion";
import { getActiveElement, getElement } from "webiny-app-cms/editor/selectors";
import { activateElement, highlightElement } from "webiny-app-cms/editor/actions";

const breadcrumbs = css({
    display: "flex",
    zIndex: 1,
    flexDirection: "row",
    padding: 0,
    position: "fixed",
    left: 55,
    bottom: 0,
    width: "calc(100% - 55px)",
    backgroundColor: "var(--mdc-theme-surface)",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    fontSize: "14px",
    "> li": {
        cursor: "pointer",
        ".element": {
            color: "var(--mdc-theme-secondary)",
            padding: "5px",
            display: "inline-block",
            "&:hover": {
                backgroundColor: "var(--mdc-theme-background)",
                color: "var(--mdc-theme-on-surface)"
            }
        },
        ".divider": {
            color: "var(--mdc-theme-text-secondary-on-background)"
        }
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
                    <span className={"element"}>{el.type.replace("cms-element-", "")}</span>
                    {elements.length - 1 > index ? (
                        <span className={"divider"}>&nbsp;&gt;&nbsp;</span>
                    ) : null}
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
