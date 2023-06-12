import React from "react";
import { Elements } from "~/components/Elements";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type TabRenderer = ReturnType<typeof createTab>;

export const createTab = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();

        const element = getElement();
        return <Elements element={element} />;
    });
};
