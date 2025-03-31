export const streamToArrayBuffer = async (readableStream) => {
    return new Promise((resolve) => {
        const chunks = [];

        readableStream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks).buffer);
        });
        readableStream.on('error', (err) => {
            if(err) throw err;
        });
    });
}