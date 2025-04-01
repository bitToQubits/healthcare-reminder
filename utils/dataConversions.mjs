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
            if(err) {
                err.isOperational = true;
                throw err;
            } 
        });
    });
}

export const getDomainName = (url_string) => {
    return url_string.replace("https://", "");
}