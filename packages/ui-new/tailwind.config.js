const { fontFamily } = require("tailwindcss/defaultTheme");
const { getProjectApplication, getProject } = require("@webiny/cli/utils");

const project = getProject();
const adminProjectApplication = getProjectApplication({ cwd: `${project.root}/apps/admin` });

const webinyPackagesGlob = `${project.root}/node_modules/@webiny/app*/**/*.js`;
const adminAppSourceGlob = `${adminProjectApplication.root}/src/**/*.tsx`;

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [webinyPackagesGlob, adminAppSourceGlob],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px"
            }
        },
        fontSize: {
            sm: "0.75rem", // 12px
            md: "0.875rem", // 14px
            base: "1rem", // 16px
            lg: "1rem", // 16px
            xl: "1.25rem" // 20px
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))"
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))"
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))"
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))"
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))"
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))"
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))"
                }
            },
            borderRadius: {
                lg: `var(--radius)`,
                md: `calc(var(--radius) - 2px)`,
                sm: "calc(var(--radius) - 4px)"
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
