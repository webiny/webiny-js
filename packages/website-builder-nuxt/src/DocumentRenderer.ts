// Re-export the base Vue DocumentRenderer unchanged.
// The Nuxt package's value-add is the headers provider (index.ts) and the
// Vite CSS-injection plugin (vite.ts), not a different renderer.
//
// If you need to swap the built-in Image component for a <NuxtImg>-backed
// version, pass your own Image component via the `components` prop:
//
//   import { createComponent } from "@webiny/website-builder-nuxt";
//   const NuxtImage = createComponent(MyNuxtImgWrapper, { name: "Webiny/Image", ... });
//   <DocumentRenderer :document="doc" :components="[NuxtImage, ...myComponents]" />
//
export { DocumentRenderer } from "@webiny/website-builder-vue";
