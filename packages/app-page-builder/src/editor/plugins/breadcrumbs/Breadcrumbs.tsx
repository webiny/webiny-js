import React from "react";
import {
    activateElementMutation,
    activeElementWithChildrenSelector,
    highlightElementMutation,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { css } from "emotion";
import { useRecoilValue, useSetRecoilState } from "recoil";

const breadcrumbs = css({
    display: "flex",
    zIndex: 20,
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
// TODO verify that connect logic was correctly transfered
const Breadcrumbs: React.FunctionComponent = () => {
    const setUiAtomValue = useSetRecoilState(uiAtom);
    const element = useRecoilValue(activeElementWithChildrenSelector);
    if (!element || element.elements.length === 0) {
        return null;
    }
    const highlightElement = (id: string) => {
        setUiAtomValue(prev => highlightElementMutation(prev, id));
    };
    const activateElement = (id: string) => {
        setUiAtomValue(prev => activateElementMutation(prev, id));
    };
    const elements = element.elements.map(({ id, type }) => ({
        id,
        type,
        active: id === element.id
    }));

    return (
        <ul className={breadcrumbs}>
            {elements.map((el, index) => (
                <li
                    key={el.id}
                    onMouseOver={() => highlightElement(el.id)}
                    onClick={() => activateElement(el.id)}
                >
                    <span className={"element"}>
                        {el.type.replace("pb-editor-page-element-", "")}
                    </span>
                    {elements.length - 1 > index ? (
                        <span className={"divider"}>&nbsp;&gt;&nbsp;</span>
                    ) : null}
                </li>
            ))}
        </ul>
    );
};
export default React.memo(Breadcrumbs);
