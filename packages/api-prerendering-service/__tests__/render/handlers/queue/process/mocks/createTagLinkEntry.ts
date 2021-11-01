import { TagUrlLink } from "~/types";

export default function ({ namespace, url, key, value }): TagUrlLink {
    return {
        namespace,
        value,
        url,
        key
    };
}
