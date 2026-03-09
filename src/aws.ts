import fs from 'fs'
import os from 'os'
import path from 'path'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import archiver from 'archiver'

const s3Client = new S3Client()

const zipDirectory = async (sourceDir: string, outPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', () => {
            console.log(`Created zip file: ${outPath} (${archive.pointer()} bytes)`)
            resolve()
        })

        archive.on('error', reject)

        archive.pipe(output)
        archive.directory(sourceDir, false)
        archive.finalize()
    })
}

const uploadToS3 = async (bucket: string, key: string, filePath: string): Promise<void> => {
    const fileStream = fs.createReadStream(filePath)

    const uploadParams = {
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: 'application/zip',
    }

    await s3Client.send(new PutObjectCommand(uploadParams))
    console.log(`Uploaded ${key} to S3 bucket ${bucket}`)
}

export const purgeS3Bucket = async (bucket: string, limit: number = 5) => {
    const listParams = {
        Bucket: bucket,
    }

    const data = await s3Client.send(new ListObjectsV2Command(listParams))
    if (!data.Contents) return

    const sortedFiles = data.Contents.sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))
    const filesToDelete = sortedFiles.slice(limit)

    if (filesToDelete.length === 0) {
        console.log('No files to delete')
        return
    }

    const deleteParams = {
        Bucket: bucket,
        Delete: {
            Objects: filesToDelete.map((file) => ({ Key: file.Key! })),
        },
    }

    const result = await s3Client.send(new DeleteObjectsCommand(deleteParams))
    console.log(result)

    console.log(`Deleted ${filesToDelete.length} old files from S3 bucket ${bucket}: ${filesToDelete.map((file) => file.Key).join(', ')}`)
}

export const uploadS3 = async (basePath: string, bucketName: string): Promise<void> => {
    if (!fs.existsSync(basePath)) {
        console.error(`Base path ${basePath} does not exist. Please run the backup script first.`)
        return
    }

    const zipPath = path.join(os.tmpdir(), `velog-backup-${Date.now()}.zip`)
    await zipDirectory(basePath, zipPath)

    await uploadToS3(bucketName, `backup-${new Date().toISOString()}.zip`, zipPath)
}
