FROM public.ecr.aws/lambda/nodejs:22
COPY package.json ${LAMBDA_TASK_ROOT}/
RUN npm install --omit=optional --no-audit --no-fund && npm install --no-save @lancedb/lancedb-linux-arm64-gnu@0.40.0 && rm -rf node_modules/onnxruntime-* node_modules/@huggingface node_modules/@img node_modules/@lancedb/lancedb-linux-arm64-musl
COPY handler.mjs bench.mjs ${LAMBDA_TASK_ROOT}/
CMD ["handler.handler"]
