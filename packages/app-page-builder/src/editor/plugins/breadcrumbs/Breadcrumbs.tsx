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
import { ReactComponent as ArrowIcon } from "./dual-tone-arrow.svg";

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
    borderTop: "1px solid var(--mdc-theme-background)",
    fontSize: "12px",
    "> li": {
        cursor: "pointer",
        display: "flex",

        "&:hover": {
            "& .element": {
                color: "var(--mdc-them-primary)",
                backgroundColor: "var(--mdc-theme-on-background)"
            },
            "& .divider svg path:first-child": {
                fill: "var(--mdc-theme-text-secondary-on-background)"
            },
            "& .divider svg path:last-child": {
                fill: "var(--mdc-theme-on-background)"
            }
        },

        ".element": {
            textTransform: "capitalize",
            color: "var(--mdc-theme-secondary)",
            padding: "7px 15px 7px 10px",
            display: "inline-block"
        },
        ".divider": {
            "& svg": {
                width: 7,
                height: 28
            },
            "& svg path:first-child": {
                fill: "var(--mdc-theme-background)"
            },
            "& svg path:last-child": {
                fill: "var(--mdc-theme-surface)"
            }
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
            {breadcrumbsList.map(({ id, type }) => (
                <li
                    key={id}
                    onMouseOver={() => highlightElement(id)}
                    onClick={() => activateElement(id)}
                >
                    <span className={"element"}>{type}</span>
                    <span className={"divider"}>
                        <ArrowIcon />
                    </span>
                </li>
            ))}
        </ul>
    );
};
export default React.memo(Breadcrumbs);
