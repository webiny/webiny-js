const { fontFamily } = require("tailwindcss/defaultTheme");
const { getProject } = require("@webiny/cli/utils");

const project = getProject();

const webinyPackagesGlob = `${project.root}/node_modules/@webiny/app*/**/*.js`;
const webinyAdminUiPackageGlob = `${project.root}/node_modules/@webiny/admin-ui/**/*.js`;
const adminAppSourceGlob = `${project.root}/apps/admin`;

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
        backgroundColor: {
            neutral: {
                DEFAULT: "hsl(var(--bg-neutral))",
                dark: "hsl(var(--bg-neutral-dark))",
                strong: "hsl(var(--bg-neutral-strong))",
                xstrong: "hsl(var(--bg-neutral-xstrong))",
                muted: "hsl(var(--bg-neutral-muted))",
                dimmed: "hsl(var(--bg-neutral-dimmed))",
                subtle: "hsl(var(--bg-neutral-subtle))",
                light: "hsl(var(--bg-neutral-light))",
                disabled: "hsl(var(--bg-neutral-disabled))",
                base: "hsl(var(--bg-neutral-base))"
            },
            primary: {
                DEFAULT: "hsl(var(--bg-primary))",
                strong: "hsl(var(--bg-primary-strong))",
                xstrong: "hsl(var(--bg-primary-xstrong))",
                muted: "hsl(var(--bg-primary-muted))",
                subtle: "hsl(var(--bg-primary-subtle))",
                disabled: "hsl(var(--bg-primary-disabled))"
            },
            secondary: {
                DEFAULT: "hsl(var(--bg-secondary))",
                strong: "hsl(var(--bg-secondary-strong))",
                xstrong: "hsl(var(--bg-secondary-xstrong))",
                muted: "hsl(var(--bg-secondary-muted))",
                subtle: "hsl(var(--bg-secondary-subtle))",
                disabled: "hsl(var(--bg-secondary-disabled))"
            },
            success: {
                DEFAULT: "hsl(var(--bg-success))",
                strong: "hsl(var(--bg-success-strong))",
                xstrong: "hsl(var(--bg-success-xstrong))",
                muted: "hsl(var(--bg-success-muted))",
                subtle: "hsl(var(--bg-success-subtle))",
                disabled: "hsl(var(--bg-success-disabled))"
            },
            destructive: {
                DEFAULT: "hsl(var(--bg-destructive))",
                strong: "hsl(var(--bg-destructive-strong))",
                xstrong: "hsl(var(--bg-destructive-xstrong))",
                muted: "hsl(var(--bg-destructive-muted))",
                subtle: "hsl(var(--bg-destructive-subtle))",
                disabled: "hsl(var(--bg-destructive-disabled))"
            },
            warning: {
                DEFAULT: "hsl(var(--bg-warning))",
                strong: "hsl(var(--bg-warning-strong))",
                xstrong: "hsl(var(--bg-warning-xstrong))",
                muted: "hsl(var(--bg-warning-muted))",
                subtle: "hsl(var(--bg-warning-subtle))",
                disabled: "hsl(var(--bg-warning-disabled))"
            }
        },
        colors: {
            primary: "hsl(var(--text-primary))",
            subtle: "hsl(var(--text-subtle))",
            muted: "hsl(var(--text-muted))",
            dimmed: "hsl(var(--text-dimmed))",
            disabled: "hsl(var(--text-disabled))",
            white: "hsl(var(--text-white))"
        },
        borderColor: {
            neutral: {
                dark: "hsl(var(--border-neutral-dark))",
                strong: "hsl(var(--border-neutral-strong))",
                muted: "hsl(var(--border-neutral-muted))",
                dimmed: "hsl(var(--border-neutral-dimmed))",
                subtle: "hsl(var(--border-neutral-subtle))"
            },

            accent: {
                DEFAULT: "hsl(var(--border-accent-default))",
                "accent-subtle": "hsl(var(--border-accent-subtle))"
            },
            destructive: "hsl(var(--border-destructive-default))",
            success: "hsl(var(--border-success-default))"
        },
        borderRadius: {
            DEFAULT: "var(--radius-sm)",
            xs: "var(--radius-xs)",
            sm: "var(--radius-sm)",
            md: "var(--radius-md)",
            lg: "var(--radius-lg)",
            xl: "var(--radius-xl)",
            xxl: "var(--radius-xxl)"
        },
        borderWidth: {
            sm: "var(--border-width-sm)",
            md: "var(--border-width-md)"
        },
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
