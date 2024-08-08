import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
    darkMode: ["class"],
    content: [__dirname + "/src/**/*.{ts,tsx}"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px"
            }
        },
        backgroundColor: {
            background: {
                DEFAULT: "hsl(var(--black-300))",
                muted: "hsl(var(--black-200))",
                subtle: "hsl(var(--black-100))",
                white: "hsl(var(--white-500))",
                transparent: "transparent"
            },
            foreground: {
                DEFAULT: "hsl(var(--black-900))",
                muted: "hsl(var(--black-500))",
                subtle: "hsl(var(--black-200))"
            },
            primary: {
                DEFAULT: "hsl(var(--primary-500))",
                muted: "hsl(var(--primary-300))",
                subtle: "hsl(var(--primary-100))",
                100: "hsl(var(--primary-100))",
                200: "hsl(var(--primary-200))",
                300: "hsl(var(--primary-300))",
                400: "hsl(var(--primary-400))",
                500: "hsl(var(--primary-500))",
                600: "hsl(var(--primary-600))",
                700: "hsl(var(--primary-700))",
                800: "hsl(var(--primary-800))",
                900: "hsl(var(--primary-900))"
            },
            secondary: {
                DEFAULT: "hsl(var(--secondary-500))",
                muted: "hsl(var(--secondary-400))",
                subtle: "hsl(var(--secondary-200))",
                100: "hsl(var(--secondary-100))",
                200: "hsl(var(--secondary-200))",
                300: "hsl(var(--secondary-300))",
                400: "hsl(var(--secondary-400))",
                500: "hsl(var(--secondary-500))",
                600: "hsl(var(--secondary-600))",
                700: "hsl(var(--secondary-700))",
                800: "hsl(var(--secondary-800))",
                900: "hsl(var(--secondary-900))"
            },
            warning: {
                DEFAULT: "hsl(var(--warning-500))",
                muted: "hsl(var(--warning-300))",
                subtle: "hsl(var(--warning-100))"
            },
            destructive: {
                DEFAULT: "hsl(var(--destructive-500))",
                muted: "hsl(var(--destructive-400))",
                subtle: "hsl(var(--destructive-100))"
            }
        },
        textColor: {
            dark: {
                DEFAULT: "hsl(var(--black-900))",
                subtle: "hsl(var(--black-600))",
                dimmed: "hsl(var(--black-400))"
            },
            white: {
                DEFAULT: "hsl(var(--white-500))"
            },
            primary: {
                DEFAULT: "hsl(var(--primary-500))",
                muted: "hsl(var(--primary-300))",
                subtle: "hsl(var(--primary-100))"
            },
            secondary: {
                DEFAULT: "hsl(var(--secondary-500))",
                muted: "hsl(var(--secondary-400))",
                subtle: "hsl(var(--secondary-200))"
            }
        },
        borderColor: {
            strong: "hsl(var(--black-900))",
            muted: "hsl(var(--black-400))",
            pale: "hsl(var(--black-200))",
            subtle: "hsl(var(--black-100))",
            primary: "hsl(var(--primary-500))",
            primarySubtle: "hsl(var(--primary-100))",
            transparent: "transparent"
        },
        fill: {
            dark: "hsl(var(--black-800))",
            light: "hsl(var(--black-500))",
            primary: "hsl(var(--primary-500))",
            white: "hsl(var(--white-500))"
        },
        fontFamily: {
            sans: ["var(--font-sans)", ...fontFamily.sans]
        },
        extend: {
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
} as Config;

export default config;
