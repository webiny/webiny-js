import React, { useCallback, useEffect, useState } from "react";
import { css } from "emotion";
import { useRecoilSnapshot, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { PbElement } from "../../../types";
import { activeElementAtom, elementByIdSelector, highlightElementAtom } from "../../recoil/modules";
import { COLORS } from "../elementSettings/components/StyledComponents";

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
    overflow: "hidden",
    "> li": {
        cursor: "pointer",
        display: "flex",
        "& .element": {
            color: COLORS.darkestGray,
            textDecoration: "none",
            textTransform: "capitalize",
            padding: "10px 0 10px 45px",
            background: "hsla(300, 2%, calc(92% - var(--element-count) * 1%), 1)",
            position: "relative",
            display: "block"
        },
        "& .element::after": {
            content: '" "',
            display: "block",
            width: "0",
            height: "0",
            borderTop: "50px solid transparent",
            borderBottom: "50px solid transparent",
            borderLeft: "30px solid hsla(300, 2%, calc(92% - var(--element-count) * 1%), 1)   ",
            position: "absolute",
            top: "50%",
            marginTop: "-50px",
            left: "100%",
            zIndex: 2
        },
        "& .element::before": {
            content: '" "',
            display: "block",
            width: "0",
            height: "0",
            borderTop: "50px solid transparent",
            borderBottom: "50px solid transparent",
            borderLeft: "30px solid hsla(0, 0%, 100%, 1)",
            position: "absolute",
            top: "50%",
            marginTop: "-50px",
            marginLeft: "1px",
            left: "100%",
            zIndex: 1
        }
    },
    "& li:first-child .element": { paddingLeft: "10px" },

    // Handle active state
    "& li .element:hover": {
        color: "var(--mdc-theme-surface)",
        background: "var(--mdc-theme-secondary)"
    },
    "& li .element:hover:after": {
        color: "var(--mdc-theme-surface)",
        borderLeftColor: "var(--mdc-theme-secondary) !important"
    }
});

const Breadcrumbs: React.FunctionComponent = () => {
    const [items, setItems] = useState([]);
    const [activeElement, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
    const setHighlightElementValue = useSetRecoilState(highlightElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElement));

    const highlightElement = useCallback((id: string) => {
        setHighlightElementValue(id);
    }, []);

    const activateElement = useCallback((id: string) => {
        setActiveElementAtomValue(id);
    }, []);

    const snapshot = useRecoilSnapshot();

    const createBreadCrumbs = async (activeElement: PbElement) => {
        const list = [];
        let element = activeElement;
        while (element.parent) {
            list.push({
                id: element.id,
                type: element.type
            });

            if (!element.parent) {
                break;
            }

            element = await snapshot.getPromise(elementByIdSelector(element.parent));
        }
        setItems(list.reverse());
    };

    useEffect(() => {
        if (element) {
            createBreadCrumbs(element);
        }
    }, [element]);

    if (!element) {
        return null;
    }

    return (
        <ul className={breadcrumbs}>
            {items.map(({ id, type }, index) => (
                <li
                    key={id}
                    onMouseOver={() => highlightElement(id)}
                    onClick={() => activateElement(id)}
                >
                    <span
                        className={"element"}
                        style={{ "--element-count": index } as React.CSSProperties}
                    >
                        {type}
                    </span>
                </li>
            ))}
        </ul>
    );
};
export default React.memo(Breadcrumbs);
