// @flow
const readFileContent = async (file: File) => {
    return new Promise(resolve => {
        const reader = new window.FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };

        reader.readAsDataURL(file);
    });
};

export default readFileContent;
