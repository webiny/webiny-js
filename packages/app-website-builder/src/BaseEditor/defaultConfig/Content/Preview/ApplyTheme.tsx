import { useEffect } from "react";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components/index.js";

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

        return () => {
            const existing = document.querySelector(`style[id="wb-editor-css"]`);
            if (existing) {
                existing.remove();
            }
        };
    }, [theme]);

    return null;
};
