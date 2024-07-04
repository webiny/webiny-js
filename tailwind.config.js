/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./apps/theme/**/*.{scss,tsx}", "apps/admin/{public,src}/*.{html,tsx,ts}"],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                brand: "hsl(var(--brand))",
                // brand: {
                //     DEFAULT: "hsl(var(--brand-500))",
                //     900: "hsl(var(--brand-900))",
                //     800: "hsl(var(--brand-800))",
                //     700: "hsl(var(--brand-700))",
                //     600: "hsl(var(--brand-600))",
                //     500: "hsl(var(--brand-500))",
                //     400: "hsl(var(--brand-400))",
                //     300: "hsl(var(--brand-300))",
                //     200: "hsl(var(--brand-200))",
                //     100: "hsl(var(--brand-100))"
                // },
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
