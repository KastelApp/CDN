/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 Ritam Choudhuri(Xcyth)
 * GPL 3.0 Licensed
 */

const minio = require('minio');

/**
 * @type {import('../../types/Utils/Minio').Minio}
 */
class Minio {
    constructor(
        endpoint,
        port,
        useSSL,
        accessKey,
        secretKey
    ) {
        this.endpoint = endpoint;
        this.port = parseInt(port);
        this.useSSL = Boolean(useSSL);
        this.accessKey = accessKey;
        this.secretKey = secretKey;

        this.client = new minio.Client({
            endPoint: this.endpoint,
            port: this.port,
            useSSL: this.useSSL,
            accessKey: this.accessKey,
            secretKey: this.secretKey
        });
    }

    async makeBucket(bucketName) {
        const bucketExists = await this.client.bucketExists(bucketName);
        if (!bucketExists) {
            this.client.makeBucket(bucketName);
            console.log(`Bucket ${bucketName} created.`);
        } else {
            console.log(`Bucket ${bucketName} already exists.`);
        }
    }

    async deleteBucket(bucketName) {
        const bucketExists = await this.client.bucketExists(bucketName);
        if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
        
        await this.client.removeBucket(bucketName);
        console.log(`Bucket ${bucketName} deleted.`);
    }

    async listBuckets() {
        const buckets = await this.client.listBuckets();
        return buckets;
    }

    async uploadFile(bucketName, fileName, filePath) {
        const bucketExists = await this.client.bucketExists(bucketName);

        if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);

        await this.client.fPutObject(bucketName, fileName, filePath);
        console.log(`File ${fileName} uploaded to bucket ${bucketName}.`);
    }

    // Having Problems!!!
    async downloadFile(bucketName, fileName, filePath) {
        const bucketExists = await this.client.bucketExists(bucketName);

        if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
        
        await this.client.fGetObject(bucketName, fileName, filePath);
        console.log(`File ${fileName} downloaded from bucket ${bucketName}.`);
    }

    async deleteFile(bucketName, fileName) {
        const bucketExists = await this.client.bucketExists(bucketName);

        if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
        
        await this.client.removeObject(bucketName, fileName);
        console.log(`File ${fileName} deleted from bucket ${bucketName}.`);
    }

    async listFiles(bucketName) {
        const bucketExists = await this.client.bucketExists(bucketName);

        if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
        
        const files = [];

        const stream = this.client.listObjectsV2(bucketName, '', true);
        for await (const file of stream) {
            files.push(file);
        }

        return files;
    }
}

module.exports = Minio;