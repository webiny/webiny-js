function toPascalCase(str: string) {
    // Step 1: Remove non-alphanumeric characters and replace them with spaces
    str = str.replace(/[^a-zA-Z0-9]+/g, " ");

    // Step 2: Split the string into words
    const words = str.split(" ");

    // Step 3: Capitalize the first letter of each word
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));

    // Step 4: Join all the capitalized words together
    return capitalizedWords.join("");
}

export class BulkActionId {
    static from(id: string) {
        return toPascalCase(id);
    }
}
