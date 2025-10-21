import React, { useEffect } from "react";
import type { FormValidation } from "@webiny/form";
import { makeDecoratable } from "@webiny/react-composition";
import { Global, css } from "@emotion/react";

// To customize the border color, use the Admin UI Colors APIs to override the default `destructive` color palette.

const ERROR_COLOR = `hsl(var(--border-destructive-default))`;
const ERROR_BACKGROUND = `hsl(var(--bg-destructive-muted))`;

const createErrorIconDataUrl = () => {
    const svgString = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.0013 4.32663L13.0213 13H2.9813L8.0013 4.32663ZM8.0013 1.66663L0.667969 14.3333H15.3346L8.0013 1.66663ZM8.66797 11H7.33463V12.3333H8.66797V11ZM8.66797 6.99996H7.33463V9.66663H8.66797V6.99996Z" fill="white"/>
        </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};

const SVG_DATA_URL = createErrorIconDataUrl();

const createMixin = (styles: string) => styles;

const errorIconMixin = createMixin(`
    position: relative;
    content: ''!important;
    display: inline-block;
    width: 20px;
    height: 20px;
    margin-right: var(--spacing-xs-plus)!important;
    background-color: ${ERROR_BACKGROUND}!important;
    background-image: url(${SVG_DATA_URL});
    background-size: 80%;
    background-position: center;
    background-repeat: no-repeat;
    top: 4px;
    border-radius: 4px;
`);

const noErrorIconMixin = createMixin(`
    content: "";
    margin: 0;
`);

const errorBorderMixin = createMixin(`
    border: 1px solid ${ERROR_COLOR};
`);

const defaultClass = css`
    .wby-content-entry-invalid-field {
        // Default fields
        .webiny_label-invalid {
            left: var(--spacing-sm-extra);

            .webiny_label-text::before {
                ${errorIconMixin}
            }
        }

        // Accordion
        .webiny_accordion-item-title::before,
        .webiny_accordion-title-text::before {
            ${errorIconMixin}
        }

        // Multiple entries
        > hcms-parent-field-provider .webiny_group-label-text::before {
            ${errorIconMixin}
        }

        // Radio buttons - hide error icon on individual options
        &[data-field-renderer="radio-buttons"] {
            [role="radiogroup"] .webiny_label-text::before {
                ${noErrorIconMixin}
            }
        }

        // Checkboxes - hide error icon on individual options
        &[data-field-renderer="checkboxes"] {
            [role="checkbox"] + label .webiny_label-text::before {
                ${noErrorIconMixin}
            }
        }
    }

    // Reference field
    .wby-content-entry-invalid-field[data-field-type="ref"] {
        .webiny_group-label-text::before {
            ${errorIconMixin}
        }

        .webiny_ref-field-container {
            ${errorBorderMixin}
        }

        &[data-field-renderer="ref-simple-single"] {
            [role="radiogroup"] .webiny_label-text::before,
            [role="checkbox"] + label .webiny_label-text::before {
                ${noErrorIconMixin}
            }
        }
    }

    // Object field
    .wby-content-entry-invalid-field[data-field-type="object"] {
        &[data-field-renderer="object"],
        &[data-field-renderer="objects"] {
            .webiny_group-label-text::before {
                ${errorIconMixin}
            }

            label {
                left: 0;

                .webiny_label-text::before {
                    ${noErrorIconMixin}
                }
            }
        }
    }
`;

const markFieldAsInvalid = (path: string, className: string): void => {
    const selector = `hcms-field-validation[data-path="${path}"]`;
    const marker = document.querySelector(selector);

    if (marker) {
        marker.classList.add(className);
    }
};

const markParentFieldsAsInvalid = (path: string, className: string): void => {
    if (!path.includes(".")) {
        return;
    }

    const pathSegments = path.split(".");
    const parentPath = pathSegments.slice(0, -1).join(".");

    markFieldAsInvalid(parentPath, className);
    markParentFieldsAsInvalid(parentPath, className);
};

const clearValidationMarkers = (className: string): void => {
    document.querySelectorAll(`.${className}`).forEach(element => {
        element.classList.remove(className);
    });
};

const applyValidationMarkers = (invalidFields: FormValidation, className: string): void => {
    Object.keys(invalidFields).forEach(fieldPath => {
        markFieldAsInvalid(fieldPath, className);
        markParentFieldsAsInvalid(fieldPath, className);
    });
};

export interface ValidationIndicatorsProps {
    invalidFields: FormValidation;
    className?: string;
}

export const ValidationIndicators = makeDecoratable(
    "ValidationIndicators",
    ({
        invalidFields,
        className = "wby-content-entry-invalid-field"
    }: ValidationIndicatorsProps) => {
        useEffect(() => {
            clearValidationMarkers(className);
            applyValidationMarkers(invalidFields, className);
        }, [invalidFields, className]);

        return <Global styles={defaultClass} />;
    }
);
