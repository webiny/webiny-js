module.exports = () => ({
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION
});
