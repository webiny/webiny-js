// @flow
export default {
    canProcess: () => {
        return true;
    },
    async process({ file, s3 }) {
        const params = s3.getObjectParams(file.name);
        return await s3.getObject({ params });
    }
};
