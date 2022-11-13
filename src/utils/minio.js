require('dotenv').config();
const minio = require('minio');

const minioClient = new minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const makeBucket = async (bucketName) => {
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
        minioClient.makeBucket(bucketName);
        console.log(`Bucket ${bucketName} created.`);
    } else {
        console.log(`Bucket ${bucketName} already exists.`);
    }
};

const deleteBucket = async (bucketName) => {
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
    
    await minioClient.removeBucket(bucketName);
    console.log(`Bucket ${bucketName} deleted.`);
};

const listBuckets = async () => {
    const buckets = await minioClient.listBuckets();
    return buckets;
}


const uploadFile = async (bucketName, fileName, filePath) => {
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);

    await minioClient.fPutObject(bucketName, fileName, filePath);
    console.log(`File ${fileName} uploaded to bucket ${bucketName}.`);
};

// Having Problems!!!
const downloadFile = async (bucketName, fileName, filePath) => {
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
    
    await minioClient.fGetObject(bucketName, fileName, filePath);
    console.log(`File ${fileName} downloaded from bucket ${bucketName}.`);
};

const deleteFile = async (bucketName, fileName) => {
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
    
    await minioClient.removeObject(bucketName, fileName);
    console.log(`File ${fileName} deleted from bucket ${bucketName}.`);
};

const listFiles = async (bucketName) => {
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (!bucketExists) return console.log(`Bucket ${bucketName} does not exist.`);
    
    const files = [];

    const stream = minioClient.listObjectsV2(bucketName, '', true);
    for await (const file of stream) {
        files.push(file);
    }

    return files;
};

module.exports = {
    makeBucket,
    deleteBucket,
    listBuckets,
    uploadFile,
    downloadFile,
    deleteFile,
    listFiles
};