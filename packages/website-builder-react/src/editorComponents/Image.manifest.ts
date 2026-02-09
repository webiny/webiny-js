"use client";
import { createFileInput, createTextInput } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { ImageComponent } from "./Image.js";

export const Image = createComponent(ImageComponent, {
    name: "Webiny/Image",
    label: "Image",
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg>`,
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
