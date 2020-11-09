import React from "react";
import { extrapolateContentElementHelper } from "@webiny/app-page-builder/editor/helpers";
import { PbShallowElement } from "@webiny/app-page-builder/types";
import {
    activateElementMutation,
    activeElementSelector,
    contentAtom,
    ContentAtomType,
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

const createBreadcrumbs = (content: ContentAtomType, element: PbShallowElement) => {
    const path = element.path;
    const list = [
        {
            id: element.id,
            type: element.type
        }
    ];
    const paths = path.split(".");
    paths.pop();
    while (paths.length > 0) {
        const el = extrapolateContentElementHelper(content, paths.join("."));
        if (!el) {
            return list.reverse();
        }
        list.push({
            id: el.id,
            type: el.type
        });
        paths.pop();
    }
    return list.reverse();
};

const Breadcrumbs: React.FunctionComponent = () => {
    const setUiAtomValue = useSetRecoilState(uiAtom);
    const element = useRecoilValue(activeElementSelector);
    const contentAtomValue = useRecoilValue(contentAtom);
    if (!element) {
        return null;
    }
    const highlightElement = (id: string) => {
        setUiAtomValue(prev => highlightElementMutation(prev, id));
    };
    const activateElement = (id: string) => {
        setUiAtomValue(prev => activateElementMutation(prev, id));
    };

    const breadcrumbsList = createBreadcrumbs(contentAtomValue, element);
    breadcrumbsList.shift();

    return (
        <ul className={breadcrumbs}>
            {breadcrumbsList.map(({ id, type }, index) => (
                <li
                    key={id}
                    onMouseOver={() => highlightElement(id)}
                    onClick={() => activateElement(id)}
                >
                    <span className={"element"}>{type}</span>
                    {breadcrumbsList.length - 1 > index ? (
                        <span className={"divider"}>&nbsp;&gt;&nbsp;</span>
                    ) : null}
                </li>
            ))}
        </ul>
    );
};
export default React.memo(Breadcrumbs);
