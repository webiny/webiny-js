import React from "react";
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
                const styles = {
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column"
                };
                const size = element.data?.settings?.grid?.size;
                if (typeof size !== "number") {
                    return styles;
                }

                styles.width = `${(size / 12) * 100}%`;
                return styles;
            }
        }
    );
};
