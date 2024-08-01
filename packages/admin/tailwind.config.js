const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["node_modules/@webiny/admin/**/*.js", __dirname + "/src/**/*.tsx"],
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
        colors: {
            transparent: "transparent",
            white: "hsl(var(--white-500))",
            foreground: {
                DEFAULT: "hsl(var(--black-900))",
                muted: "hsl(var(--black-500))",
                subtle: "hsl(var(--black-200))"
            },
            background: {
                DEFAULT: "hsl(var(--black-300))",
                muted: "hsl(var(--black-200))",
                subtle: "hsl(var(--black-100))",
                white: "hsl(var(--white-500))"
            },
            primary: {
                DEFAULT: "hsl(var(--orange-500))",
                100: "hsl(var(--orange-100))",
                200: "hsl(var(--orange-200))",
                300: "hsl(var(--orange-300))",
                400: "hsl(var(--orange-400))",
                500: "hsl(var(--orange-500))",
                600: "hsl(var(--orange-600))",
                700: "hsl(var(--orange-700))",
                800: "hsl(var(--orange-800))",
                900: "hsl(var(--orange-900))"
            },
            secondary: {
                DEFAULT: "hsl(var(--teal-500))",
                100: "hsl(var(--teal-100))",
                200: "hsl(var(--teal-200))",
                300: "hsl(var(--teal-300))",
                400: "hsl(var(--teal-400))",
                500: "hsl(var(--teal-500))",
                600: "hsl(var(--teal-600))",
                700: "hsl(var(--teal-700))",
                800: "hsl(var(--teal-800))",
                900: "hsl(var(--teal-900))"
            },
            destructive: {
                DEFAULT: "hsl(var(--red-500))",
                100: "hsl(var(--red-100))",
                200: "hsl(var(--red-200))",
                300: "hsl(var(--red-300))",
                400: "hsl(var(--red-400))",
                500: "hsl(var(--red-500))",
                600: "hsl(var(--red-600))",
                700: "hsl(var(--red-700))",
                800: "hsl(var(--red-800))",
                900: "hsl(var(--red-900))"
            },
            warning: {
                DEFAULT: "hsl(var(--yellow-500))",
                100: "hsl(var(--yellow-100))",
                200: "hsl(var(--yellow-200))",
                300: "hsl(var(--yellow-300))",
                400: "hsl(var(--yellow-400))",
                500: "hsl(var(--yellow-500))",
                600: "hsl(var(--yellow-600))",
                700: "hsl(var(--yellow-700))",
                800: "hsl(var(--yellow-800))",
                900: "hsl(var(--yellow-900))"
            }
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))"
            },
            borderRadius: {
                xl: `calc(var(--radius) + 2px)`,
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
