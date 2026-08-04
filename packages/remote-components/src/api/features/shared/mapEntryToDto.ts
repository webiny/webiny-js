import type { RemoteComponentDto } from "~/shared/types.js";

export function mapEntryToDto(entry: Record<string, any>): RemoteComponentDto {
    const values = entry.values ?? entry;
    return {
        id: entry.entryId ?? entry.id ?? "",
        name: values.name ?? "",
        label: values.label ?? "",
        description: values.description ?? "",
        aiContext: values.aiContext ?? "",
        source: values.source ?? "",
        css: values.css ?? "",
        bundledJs: values.bundledJs ?? "",
        bundledJsSha256: values.bundledJsSha256 ?? "",
        bundledCss: values.bundledCss ?? "",
        bundledCssSha256: values.bundledCssSha256 ?? "",
        aiPrompt: values.aiPrompt ?? "",
        status: values.status ?? "draft",
        sdkVersion: values.sdkVersion ?? "1",
        createdOn: entry.createdOn ?? "",
        savedOn: entry.savedOn ?? ""
    };
}
