import { escapeHtml } from "~/features/notifications/shared/escapeHtml.js";
import { toSingleLine } from "~/domain/notifications/toSingleLine.js";
import type { NotificationTransport } from "./abstractions.js";

/** The two bodies of a notification e-mail. */
export interface NotificationMail {
    text: string;
    html: string;
}

/** One row of the details table: a fixed label and a one-line value. */
interface NotificationMailRow {
    label: string;
    value: string;
}

const GREETING = "Hi,";

// Plain inline CSS: e-mail clients ignore style sheets. Neutral greys only.
const TEXT_COLOR = "#333333";
const MUTED_COLOR = "#6b6b6b";
const BOX_COLOR = "#f5f5f5";
const FONT_FAMILY =
    "font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
const CONTAINER_STYLE = `${FONT_FAMILY}max-width:640px;margin:0 auto;padding:24px;background:#ffffff;color:${TEXT_COLOR};font-size:16px;line-height:1.5;`;
const PARAGRAPH_STYLE = `${FONT_FAMILY}margin:0 0 16px 0;color:${TEXT_COLOR};font-size:16px;line-height:1.5;`;
const TABLE_STYLE = `${FONT_FAMILY}width:100%;border-collapse:separate;border-spacing:0 4px;margin:0 0 24px 0;padding:12px 16px;background:${BOX_COLOR};border-radius:8px;font-size:14px;line-height:1.5;`;
const LABEL_STYLE = `${FONT_FAMILY}width:120px;padding:0;color:${MUTED_COLOR};vertical-align:top;`;
const VALUE_STYLE = `${FONT_FAMILY}padding:0;color:${TEXT_COLOR};vertical-align:top;`;
const BUTTON_WRAPPER_STYLE = "margin:0 0 24px 0;";
const BUTTON_STYLE = `${FONT_FAMILY}display:inline-block;padding:10px 16px;border-radius:4px;background:#333333;color:#ffffff;font-size:14px;line-height:1.5;text-decoration:none;`;
const FOOTER_STYLE = `${FONT_FAMILY}margin:0;color:${MUTED_COLOR};font-size:14px;line-height:1.5;`;

const getRows = (details: NotificationTransport.MessageDetails): NotificationMailRow[] => {
    const contentTitle = toSingleLine(details.contentTitle);
    const contentType = details.contentType === null ? "" : toSingleLine(details.contentType);
    return [
        {
            label: "Content",
            value: contentType === "" ? contentTitle : `${contentType} · ${contentTitle}`
        },
        {
            label: "Step",
            value: `${details.stepNumber} of ${details.stepCount} · ${toSingleLine(details.stepTitle)}`
        },
        { label: "Requested by", value: toSingleLine(details.requester) }
    ];
};

/**
 * The text and HTML bodies of a notification e-mail (D153): a greeting, the message, the details
 * table, the link as a button and the footer. Every value in the HTML goes through `escapeHtml`;
 * the text part mirrors the HTML as lines. Parts the message does not carry are left out. Pure.
 */
export const renderNotificationMail = (
    message: NotificationTransport.Message
): NotificationMail => {
    const rows = message.details ? getRows(message.details) : [];
    const footer = message.footer?.trim() ?? "";

    const textParts: string[] = [GREETING, message.body];
    const htmlParts: string[] = [
        `<p style="${PARAGRAPH_STYLE}">${escapeHtml(GREETING)}</p>`,
        `<p style="${PARAGRAPH_STYLE}">${escapeHtml(message.body).replace(/\n/g, "<br/>")}</p>`
    ];

    if (rows.length > 0) {
        textParts.push(rows.map(row => `${row.label}: ${row.value}`).join("\n"));
        const htmlRows = rows.map(row => {
            return `<tr><td style="${LABEL_STYLE}">${escapeHtml(row.label)}</td><td style="${VALUE_STYLE}">${escapeHtml(row.value)}</td></tr>`;
        });
        htmlParts.push(
            `<table role="presentation" style="${TABLE_STYLE}">${htmlRows.join("")}</table>`
        );
    }

    if (message.url !== null) {
        textParts.push(`${message.linkLabel}: ${message.url}`);
        htmlParts.push(
            `<div style="${BUTTON_WRAPPER_STYLE}"><a href="${escapeHtml(message.url)}" style="${BUTTON_STYLE}">${escapeHtml(message.linkLabel)}</a></div>`
        );
    }

    if (footer !== "") {
        textParts.push(footer);
        htmlParts.push(`<p style="${FOOTER_STYLE}">${escapeHtml(footer)}</p>`);
    }

    const html = `<div style="${CONTAINER_STYLE}">${htmlParts.join("")}</div>`;
    return { text: textParts.join("\n\n"), html };
};
