export default () => ({
    bucket: process.env.S3_BUCKET as string,
    region: process.env.AWS_REGION as string
});
