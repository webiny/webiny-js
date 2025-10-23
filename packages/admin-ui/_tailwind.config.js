// import findUp from "find-up";
// import path from "path";
// import twFontFamily from "tailwindcss/defaultTheme.js";
//
// const projectConfig = findUp.sync("webiny.config.tsx");
// const projectRoot = path.dirname(projectConfig);
//
// const webinyPackagesGlob = `${projectRoot}/node_modules/@webiny/app*/**/*.{js,ts,tsx}`;
// const webinyAdminUiPackageGlob = `${projectRoot}/node_modules/@webiny/admin-ui/**/*.{js,ts,tsx}`;
// const webinyUiPackageGlob = `${projectRoot}/node_modules/@webiny/ui/**/*.{js,ts,tsx}`;
// const adminAppSourceGlob = `${projectRoot}/.webiny/workspaces/apps/admin`;
// import theme from "./tailwind.config.theme.js";
//
// const {
//     animation,
//     backgroundColor,
//     keyframes,
//     shadow,
//     spacing,
//     zIndex
// } = theme;
//
// /** @type {import('tailwindcss').Config} */
// export default {
//     darkMode: ["class"],
//     content: [
//         webinyPackagesGlob,
//         webinyAdminUiPackageGlob,
//         webinyUiPackageGlob,
//         adminAppSourceGlob
//     ],
//     theme: {
//         container: {
//             center: true,
//             padding: padding.xxl,
//             screens: {
//                 "2xl": "1200px",
//                 xl: "1200px"
//             }
//         },
//
//         backgroundColor,
//         fontSize,
//         shadow,
//
//         fontFamily: {
//             sans: ["var(--font-sans)", ...twFontFamily.fontFamily.sans],
//             serif: ["var(--font-serif)", ...twFontFamily.fontFamily.serif],
//             mono: ["var(--font-mono)", ...twFontFamily.fontFamily.mono]
//         },
//
//         extend: {
//             animation,
//             borderRadius,
//             keyframes,
//             margin,
//             padding,
//             spacing,
//             zIndex
//         }
//     },
//
//     plugins: []
// };
