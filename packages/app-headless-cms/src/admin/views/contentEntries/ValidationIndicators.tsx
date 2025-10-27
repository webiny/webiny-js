import React, { useEffect } from "react";
import type { FormValidation } from "@webiny/form";
import { makeDecoratable } from "@webiny/react-composition";
import { Global, css } from "@emotion/react";

// To customize the border color, use the Admin UI Colors APIs to override the default `destructive` color palette.

const ERROR_COLOR = `hsl(var(--border-destructive-default))`;
const ERROR_COLOR_MUTED = `hsl(var(--bg-destructive-muted))`;

const createErrorIconDataUrl = (): string => {
    const svgString = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.0013 4.32663L13.0213 13H2.9813L8.0013 4.32663ZM8.0013 1.66663L0.667969 14.3333H15.3346L8.0013 1.66663ZM8.66797 11H7.33463V12.3333H8.66797V11ZM8.66797 6.99996H7.33463V9.66663H8.66797V6.99996Z" fill="white"/>
        </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};

const SVG_DATA_URL = createErrorIconDataUrl();

// Style mixins
const errorIconStyles = css`
    content: "" !important;
    display: inline-block;
    width: 20px;
    height: 20px;
    margin-right: var(--spacing-xs-plus) !important;
    background-color: ${ERROR_COLOR_MUTED} !important;
    background-image: url(${SVG_DATA_URL});
    background-size: 80%;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 4px;
`;

const noErrorIconStyles = css`
    content: "";
    margin: 0;
`;

const errorBorderStyles = css`
    border: 1px solid ${ERROR_COLOR};
`;

const validationStyles = css`
    .wby-content-entry-invalid-field {
        // Default fields
        .webiny_label-invalid {
            left: var(--spacing-sm-extra);

            .webiny_label-text::before {
                ${errorIconStyles}
            }
        }

        // Accordion
        .webiny_accordion-item-title::before,
        .webiny_accordion-title-text::before {
            ${errorIconStyles}
            position: absolute;
            left: -10px;
            top: 17px;
        }

        // Multiple entries
        > hcms-parent-field-provider .webiny_group-label-text::before {
            ${errorIconStyles}
        }

        // Radio buttons - hide error icon on individual options
        &[data-field-renderer="radio-buttons"] {
            [role="radiogroup"] .webiny_label-text::before {
                ${noErrorIconStyles}
            }
        }

        // Checkboxes - hide error icon on individual options
        &[data-field-renderer="checkboxes"] {
            [role="checkbox"] + label .webiny_label-text::before {
                ${noErrorIconStyles}
            }
        }
    }

    // Reference field
    .wby-content-entry-invalid-field[data-field-type="ref"] {
        .webiny_group-label-text::before {
            ${errorIconStyles}
        }

        .webiny_ref-field-container {
            ${errorBorderStyles}
        }

        &[data-field-renderer="ref-simple-single"] {
            [role="radiogroup"] .webiny_label-text::before,
            [role="checkbox"] + label .webiny_label-text::before {
                ${noErrorIconStyles}
            }
        }
    }

    // Object field
    .wby-content-entry-invalid-field[data-field-type="object"] {
        &[data-field-renderer="objects"] > div {
            border: 1px solid ${ERROR_COLOR_MUTED};
            border-radius: var(--radius-lg);
        }

        &[data-field-renderer="object"],
        &[data-field-renderer="objects"] {
            .webiny_group-label-text::before {
                display: none;
            }

            label {
                left: 0;

                .webiny_label-text::before {
                    ${noErrorIconStyles}
                }
            }
        }
    }
`;

// Validation marker utilities
const getFieldElement = (path: string): Element | null => {
    return document.querySelector(`hcms-field-validation[data-path="${path}"]`);
};

const getParentPaths = (path: string): string[] => {
    if (!path.includes(".")) {
        return [];
    }

    const segments = path.split(".");
    return segments.map((_, index) => segments.slice(0, index).join(".")).filter(Boolean);
};

const markFieldAsInvalid = (path: string, className: string): void => {
    const element = getFieldElement(path);
    element?.classList.add(className);
};

const applyValidationMarkers = (invalidFields: FormValidation, className: string): void => {
    Object.keys(invalidFields).forEach(fieldPath => {
        // Mark the field and all its parent fields
        [fieldPath, ...getParentPaths(fieldPath)].forEach(path => {
            markFieldAsInvalid(path, className);
        });
    });
};

const clearValidationMarkers = (className: string): void => {
    document.querySelectorAll(`.${className}`).forEach(element => {
        element.classList.remove(className);
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

        return <Global styles={validationStyles} />;
    }
);
