import type { Client, BucketItemFromList } from 'minio';

declare class Minio {
    private endpoint: string;
    private accessKey: string;
    private secretKey: string;
    private useSSL: boolean;
    private port: number;
    public readonly client: Client;
    constructor(endpoint: string, port: number | string, useSSL: boolean, accessKey: string, secretKey: string);

    public makeBucket(bucketName: string): Promise<void>;

    public deleteBucket(bucketName: string): Promise<void>;

    public listBuckets(): Promise<BucketItemFromListp[]>;

    public uploadFile(bucketName: string, fileName: string, filePath: string): Promise<void>;

    public downloadFile(bucketName: string, fileName: string, filePath: string): Promise<void>;

    public deleteFile(bucketName: string, fileName: string): Promise<void>;

    public listFiles(bucketName: string): Promise<Buffer[]>;
}