import React, { useCallback, useEffect, useState } from "react";
import { useRecoilCallback, useRecoilSnapshot } from "recoil";
import { PbEditorElement } from "~/types";
import { breadcrumbs } from "./styles";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useHighlightElement } from "~/editor/hooks/useHighlightElement";
import { elementByIdSelector, elementsAtom, ElementsAtomType } from "~/editor/recoil/modules";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";

type ItemsState = Pick<ElementsAtomType, "id" | "type">;

const Breadcrumbs: React.FunctionComponent = () => {
    const [items, setItems] = useState<ItemsState[]>([]);
    const [, setActiveElementId] = useActiveElementId();
    const element = useActiveElement();
    const [highlightedElement, setHighlightElement] = useHighlightElement();
    const snapshot = useRecoilSnapshot();
    const lazyHighlight = useRecoilCallback(
        ({ set }) =>
            async (id: string) => {
                if (highlightedElement) {
                    // Update the element that is currently highlighted
                    set(elementsAtom(highlightedElement.id), (prevValue: ElementsAtomType) => {
                        return {
                            ...prevValue,
                            isHighlighted: false
                        };
                    });
                }

                // Set the new highlighted element
                setHighlightElement(id);

                // Update the element that is about to be highlighted
                set(elementsAtom(id), (prevValue: ElementsAtomType) => {
                    return {
                        ...prevValue,
                        isHighlighted: true
                    };
                });
            },
        [highlightedElement]
    );

    const highlightElement = useCallback(
        (id: string) => {
            lazyHighlight(id);
        },
        [lazyHighlight]
    );

    const activateElement = useCallback((id: string) => {
        setActiveElementId(id);
    }, []);

    const createBreadCrumbs = async (activeElement: PbEditorElement) => {
        const list: ItemsState[] = [];
        let element = activeElement;
        while (element.parent) {
            list.push({
                id: element.id,
                type: element.type
            });

            if (!element.parent) {
                break;
            }

            element = (await snapshot.getPromise(
                elementByIdSelector(element.parent)
            )) as PbEditorElement;
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
