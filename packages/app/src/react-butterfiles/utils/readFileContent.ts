export const readFileContent = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new window.FileReader();
        reader.onload = function (e) {
            if (e.target) {
                resolve(e.target.result as string);
            } else {
                reject(`Unable to read file contents!`);
            }
        };

        reader.readAsDataURL(file);
    });
};
