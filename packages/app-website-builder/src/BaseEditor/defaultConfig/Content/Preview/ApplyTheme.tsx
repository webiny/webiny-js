import { useEffect } from "react";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components";

export const ApplyTheme = () => {
    const { theme } = useWebsiteBuilderTheme();

    useEffect(() => {
        if (!theme) {
            return;
        }

        if (theme.css) {
            const existing = document.querySelector(`style[id="wb-editor-css"]`);

            const style = document.createElement("style");
            style.id = "wb-editor-css";
            style.innerHTML = theme.css;

            if (existing) {
                existing.replaceWith(style);
            } else {
                document.head.appendChild(style);
            }
        }

        if (theme.cssVariables) {
            const existing = document.querySelector(`style[id="wb-editor-css-variables"]`);

            const style = document.createElement("style");
            style.id = "wb-editor-css-variables";
            style.innerHTML = `:root {
                ${Object.entries(theme.cssVariables)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\n")}
            `;

            if (existing) {
                existing.replaceWith(style);
            } else {
                document.head.appendChild(style);
            }
        }

        if (theme.fonts) {
            theme.fonts.forEach(font => {
                const existing = document.querySelector(`link[href="${font}"]`);
                if (existing) {
                    return;
                }

                const link = document.createElement("link");
                link.href = font;
                link.rel = "stylesheet";
                document.head.appendChild(link);
            });
        }
    }, [theme]);

    return null;
};
