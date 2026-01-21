import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import type { DocumentElement } from "@webiny/website-builder-sdk";

type ActiveElementProps = {
    children: (element: DocumentElement) => React.ReactNode;
};

export const ActiveElement = ({ children }: ActiveElementProps) => {
    const [element] = useActiveElement();
    if (!element) {
        return null;
    }

    return children(element);
};
