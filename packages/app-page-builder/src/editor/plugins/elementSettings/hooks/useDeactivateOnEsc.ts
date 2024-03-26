import { useEffect } from "react";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

export function useDeactivateOnEsc() {
    const [, setActiveElement] = useActiveElement();
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            setActiveElement(null);
        });

        return () => removeKeyHandler("escape");
    });
}
