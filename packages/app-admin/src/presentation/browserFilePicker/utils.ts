export function generateId(): string {
    return "_" + Math.random().toString(36).substr(2, 9);
}

export function readFileContent(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (e.target) {
                resolve(e.target.result as string);
            } else {
                reject("Unable to read file contents!");
            }
        };
        reader.readAsDataURL(file);
    });
}
