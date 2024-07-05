/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["apps/admin/{public,src}/*.{html,tsx,ts}", "packages/ui-shadcn/src/**/*.{ts,tsx}"],
    safelist: [
        {
            pattern: /./
        }
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--brand-200))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                transparent: "transparent",
                brand: {
                    DEFAULT: "hsl(var(--brand-500))",
                    900: "hsl(var(--brand-900))",
                    800: "hsl(var(--brand-800))",
                    700: "hsl(var(--brand-700))",
                    600: "hsl(var(--brand-600))",
                    500: "hsl(var(--brand-500))",
                    400: "hsl(var(--brand-400))",
                    300: "hsl(var(--brand-300))",
                    200: "hsl(var(--brand-200))",
                    100: "hsl(var(--brand-100))"
                },
                black: "hsl(var(--black))",
                gray: {
                    DEFAULT: "hsl(var(--gray-500))",
                    900: "hsl(var(--gray-900))",
                    800: "hsl(var(--gray-800))",
                    700: "hsl(var(--gray-700))",
                    600: "hsl(var(--gray-600))",
                    500: "hsl(var(--gray-500))",
                    400: "hsl(var(--gray-400))",
                    300: "hsl(var(--gray-300))",
                    200: "hsl(var(--gray-200))",
                    100: "hsl(var(--gray-100))"
                }
            },
            fontFamily: {
                sans: ['"Inter"', "sans-serif"]
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
