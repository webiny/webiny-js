import type { WebsiteBuilderThemeInput } from "~/types/WebsiteBuilderTheme.js";

export const defaultBreakpoints: NonNullable<WebsiteBuilderThemeInput["breakpoints"]> = {
    desktop: {
        title: "Desktop",
        description: `Desktop styles apply at all breakpoints, unless they're edited at a lower breakpoint. Start your styling here.`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M13.3333 12C14.0667 12 14.6667 11.4 14.6667 10.6666V3.99996C14.6667 3.26663 14.0667 2.66663 13.3333 2.66663H2.66667C1.93333 2.66663 1.33333 3.26663 1.33333 3.99996V10.6666C1.33333 11.4 1.93333 12 2.66667 12H0V13.3333H16V12H13.3333ZM2.66667 3.99996H13.3333V10.6666H2.66667V3.99996Z" fill="#59626D"/>
</svg>`,
        minWidth: 0,
        maxWidth: 4000
    },
    tablet: {
        title: "Tablet",
        description: `Styles added here will apply at 991px and below, unless they're edited at a smaller breakpoint.`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <g clip-path="url(#clip0_6424_8826)">
    <path d="M12.666 0H3.33268C2.41268 0 1.66602 0.746667 1.66602 1.66667V14.3333C1.66602 15.2533 2.41268 16 3.33268 16H12.666C13.586 16 14.3327 15.2533 14.3327 14.3333V1.66667C14.3327 0.746667 13.586 0 12.666 0ZM7.99935 15.3333C7.44602 15.3333 6.99935 14.8867 6.99935 14.3333C6.99935 13.78 7.44602 13.3333 7.99935 13.3333C8.55268 13.3333 8.99935 13.78 8.99935 14.3333C8.99935 14.8867 8.55268 15.3333 7.99935 15.3333ZM12.9993 12.6667H2.99935V2H12.9993V12.6667Z" fill="#9DA4B0"/>
  </g>
  <defs>
    <clipPath id="clip0_6424_8826">
      <rect width="16" height="16" fill="white"/>
    </clipPath>
  </defs>
</svg>`,
        minWidth: 0,
        maxWidth: 991
    },
    mobile: {
        title: "Mobile",
        description: `Styles added here will apply at 430px and below.`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <g clip-path="url(#clip0_6405_34405)">
    <path d="M11.333 0.673293L4.66634 0.666626C3.93301 0.666626 3.33301 1.26663 3.33301 1.99996V14C3.33301 14.7333 3.93301 15.3333 4.66634 15.3333H11.333C12.0663 15.3333 12.6663 14.7333 12.6663 14V1.99996C12.6663 1.26663 12.0663 0.673293 11.333 0.673293ZM11.333 12.6666H4.66634V3.33329H11.333V12.6666Z" fill="#9DA4B0"/>
  </g>
  <defs>
    <clipPath id="clip0_6405_34405">
      <rect width="16" height="16" fill="white"/>
    </clipPath>
  </defs>
</svg>`,
        minWidth: 0,
        maxWidth: 430
    }
};
