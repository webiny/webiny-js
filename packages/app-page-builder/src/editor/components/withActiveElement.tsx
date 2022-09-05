import React from "react";
import { activeElementAtom, elementByIdSelector } from "../recoil/modules";
import { useRecoilValue } from "recoil";

export function withActiveElement() {
    return function decorator(Component: React.ComponentType<any>): React.FC {
        return function ActiveElementComponent(props) {
            const activeElementId = useRecoilValue(activeElementAtom);
            const element = useRecoilValue(elementByIdSelector(activeElementId));

            if (!activeElementId) {
                return null;
            }
            return <Component {...props} element={element} />;
        };
    };
}
