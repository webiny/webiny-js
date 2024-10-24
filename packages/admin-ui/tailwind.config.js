const { fontFamily } = require("tailwindcss/defaultTheme");
const { getProject } = require("@webiny/cli/utils");

const project = getProject();

const webinyPackagesGlob = `${project.root}/node_modules/@webiny/app*/**/*.js`;
const webinyAdminUiPackageGlob = `${project.root}/node_modules/@webiny/admin-ui/**/*.js`;
const adminAppSourceGlob = `${project.root}/apps/admin`;
const {
    backgroundColor,
    borderColor,
    textColor,
    borderRadius,
    borderWidth
} = require("./tailwind.config.customizations");

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [webinyPackagesGlob, webinyAdminUiPackageGlob, adminAppSourceGlob],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px"
            }
        },

        backgroundColor,
        colors: textColor,
        borderColor,
        borderRadius,
        borderWidth,
        extend: {
            padding: {
                xs: "var(--padding-xs)",
                sm: "var(--padding-sm)",
                md: "var(--padding-md)",
                lg: "var(--padding-lg)",
                xl: "var(--padding-xl)",
                xxl: "var(--padding-xxl)"
            },
            fontFamily: {
                sans: ["var(--font-sans)", ...fontFamily.sans]
            },

            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" }
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" }
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out"
            }
        }
    },
    plugins: [require("tailwindcss-animate")]
};
