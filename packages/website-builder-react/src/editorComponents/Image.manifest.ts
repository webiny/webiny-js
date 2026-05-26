"use client";
import { createFileInput, createTextInput } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { ImageComponent } from "./Image.js";

export const Image = createComponent(ImageComponent, {
    name: "Webiny/Image",
    label: "Image",
    aiContext: "Displays an image from the file manager with configurable title and alt text.",
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>`,
    autoApplyStyles: false,
    inputs: {
        image: createFileInput({
            label: "Image",
            allowedFileTypes: ["image/*"],
            onChange: ({ inputs }) => {
                if (inputs.image) {
                    inputs.title = inputs.image.name;
                    inputs.altText = inputs.image.name;
                }
            }
        }),
        title: createTextInput({
            label: "Title",
            description: "Title of the image"
        }),
        altText: createTextInput({
            label: "Alternate Text",
            description: "Shown when the user has disabled images"
        })
    },
    defaults: {
        styles: {
            width: "100%"
        }
    }
});
