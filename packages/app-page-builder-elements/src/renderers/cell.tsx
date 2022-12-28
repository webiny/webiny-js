import React, { useMemo } from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type CellRenderer = ReturnType<typeof createCell>;

export const createCell = () => {
    return createRenderer(() => {
        const { getElement, getAttributes } = useRenderer();

        const element = getElement();

        const width = useMemo<string>(() => {
            const size = element.data?.settings?.cell?.size;
            if (typeof size !== "number") {
                return "100%";
            }
            return `${(size / 12) * 100}%`;
        }, [element.id]);

        return (
            <div {...getAttributes()} style={{ width }}>
                <Elements element={element} />
            </div>
        );
    });
};
