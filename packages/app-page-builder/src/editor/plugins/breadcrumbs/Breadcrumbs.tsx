import React, { useCallback, useEffect, useState } from "react";
import { useRecoilCallback, useRecoilSnapshot, useRecoilState, useRecoilValue } from "recoil";
import { PbEditorElement } from "~/types";
import {
    activeElementAtom,
    elementByIdSelector,
    elementsAtom,
    highlightElementAtom
} from "../../recoil/modules";
import { breadcrumbs } from "./styles";

const Breadcrumbs: React.FunctionComponent = () => {
    const [items, setItems] = useState([]);
    const [activeElement, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElement));
    const [highlightElementAtomValue, setHighlightElementAtomValue] =
        useRecoilState(highlightElementAtom);
    const snapshot = useRecoilSnapshot();
    const lazyHighlight = useRecoilCallback(
        ({ set }) =>
            async (id: string): Promise<void> => {
                if (highlightElementAtomValue) {
                    // Update the element that is currently highlighted
                    set(elementsAtom(highlightElementAtomValue), prevValue => {
                        return {
                            ...prevValue,
                            isHighlighted: false
                        };
                    });
                }

                // Set the new highlighted element
                setHighlightElementAtomValue(id);

                // Update the element that is about to be highlighted
                set(elementsAtom(id), prevValue => {
                    return {
                        ...prevValue,
                        isHighlighted: true
                    };
                });
            },
        [highlightElementAtomValue]
    );

    const highlightElement = useCallback(
        (id: string): void => {
            lazyHighlight(id);
        },
        [lazyHighlight]
    );

    const activateElement = useCallback((id: string): void => {
        setActiveElementAtomValue(id);
    }, []);

    const createBreadCrumbs = async (activeElement: PbEditorElement): Promise<void> => {
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

    useEffect((): void => {
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
