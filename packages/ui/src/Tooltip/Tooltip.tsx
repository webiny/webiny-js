import React, { useCallback } from "react";
import { Tooltip as TooltipAdmin, TooltipProps as TooltipPropsAdmin } from "@webiny/admin-ui";

export interface TooltipProps {
    // A component (eg. button) which will trigger the tooltip.
    children: React.ReactNode;

    // Content which will be shown inside the tooltip.
    content: React.ReactNode;

    // Defines which action will trigger the tooltip: "hover", "click" or "focus".
    trigger?: string;

    // Can be "left","right","top","bottom", "topLeft", "topRight", "bottomLeft" or "bottomRight".
    placement?:
        | "left"
        | "right"
        | "top"
        | "bottom"
        | "topLeft"
        | "topRight"
        | "bottomLeft"
        | "bottomRight";

    // CSS class name
    className?: string;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `<Tooltip />` component from the `@webiny/admin-ui` package instead.
 */
export const Tooltip = ({
    children,
    content,
    placement,
    className = "webiny-ui-tooltip"
}: TooltipProps) => {
    const mapPlacementToSideAndAlign = useCallback((placement?: string) => {
        const placementMapping: Record<
            string,
            { side: TooltipPropsAdmin["side"]; align: TooltipPropsAdmin["align"] }
        > = {
            left: { side: "left", align: undefined },
            right: { side: "right", align: undefined },
            top: { side: "top", align: undefined },
            bottom: { side: "bottom", align: undefined },
            topLeft: { side: "top", align: "start" },
            topRight: { side: "top", align: "end" },
            bottomLeft: { side: "bottom", align: "start" },
            bottomRight: { side: "bottom", align: "end" }
        };

        return placementMapping[placement ?? ""] || { side: undefined, align: undefined };
    }, []);

    const { side, align } = mapPlacementToSideAndAlign(placement);

    return (
        <TooltipAdmin
            trigger={children}
            content={content}
            className={className}
            side={side}
            align={align}
        />
    );
};
