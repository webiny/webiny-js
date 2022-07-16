import React, { useCallback, useEffect, useState } from "react";
import { useRecoilCallback, useRecoilSnapshot } from "recoil";
import { createComponentPlugin } from "@webiny/app-admin";
import { PbEditorElement } from "~/types";
import { breadcrumbs } from "./styles";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useHighlightElement } from "~/editor/hooks/useHighlightElement";
import { elementByIdSelector, elementsAtom, ElementsAtomType } from "~/editor/recoil/modules";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { EditorContent } from "~/editor";

type ItemsState = Pick<ElementsAtomType, "id" | "type">;

const Breadcrumbs: React.FC = () => {
    const [items, setItems] = useState<ItemsState[]>([]);
    const [, setActiveElementId] = useActiveElementId();
    const [element] = useActiveElement();
    const [highlightedElement, setHighlightElement] = useHighlightElement();
    const snapshot = useRecoilSnapshot();
    const lazyHighlight = useRecoilCallback(
        ({ set }) =>
            async (id: string) => {
                if (highlightedElement) {
                    /**
                     * Update the element that is currently highlighted.
                     * We are positive that this value is not null.
                     */
                    set(elementsAtom(highlightedElement.id), prevValue => {
                        if (!prevValue) {
                            return null;
                        }
                        return {
                            ...prevValue,
                            isHighlighted: false
                        };
                    });
                }

                // Set the new highlighted element
                setHighlightElement(id);

                /**
                 * Update the element that is about to be highlighted
                 * We are positive that this value is not null.
                 */
                set(elementsAtom(id), prevValue => {
                    if (!prevValue) {
                        return null;
                    }
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

    const createBreadCrumbs = useCallback(
        async (activeElement: PbEditorElement) => {
            const list: ItemsState[] = [];
            let element = activeElement;
            while (element) {
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
            setItems(list.reverse().slice(1));
        },
        [snapshot]
    );

    useEffect(() => {
        if (!element) {
            return;
        }
        createBreadCrumbs(element);
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

export const BreadcrumbsPlugin = createComponentPlugin(EditorContent, PrevContent => {
    return function AddBreadcrumbs() {
        return (
            <>
                <PrevContent />
                <Breadcrumbs />
            </>
        );
    };
});
