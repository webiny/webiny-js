import React, { useMemo } from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type CellRenderer = ReturnType<typeof createCell>;

export const createCell = () => {
    return createRenderer(
        () => {
            const { getElement } = useRenderer();

            const element = getElement();
            return <Elements element={element} />;
        },
        {
            baseStyles: ({ element }) => {
                const size = element.data?.settings?.grid?.size;
                if (typeof size !== "number") {
                    return { width: "100%" };
                }
                return { width: `${(size / 12) * 100}%` };
            }
        }
    );
};
