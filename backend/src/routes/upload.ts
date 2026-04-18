import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

const S3_ENDPOINT   = process.env.S3_ENDPOINT   || 'https://s3-nl.hostkey.com';
const S3_BUCKET     = process.env.S3_BUCKET     || 'b31091318-tiger-apps';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || '';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || '';
const S3_REGION     = process.env.S3_REGION     || 'us-east-1';
const S3_PREFIX     = 'threadline/';

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId:     S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // required for Ceph/non-AWS
});

// Public URL builder
function publicUrl(key: string): string {
  return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
}

export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {

  // @ts-ignore
  await fastify.register(import('@fastify/multipart'), {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  });

  fastify.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
      return reply.code(503).send({ error: 'S3 not configured' });
    }

    try {
      // @ts-ignore
      const data = await request.file();
      if (!data) return reply.code(400).send({ error: 'No file provided' });

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) chunks.push(chunk);
      const buffer      = Buffer.concat(chunks);
      const contentType = data.mimetype || 'application/octet-stream';
      const origName    = (data.filename || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
      const key         = `${S3_PREFIX}${Date.now()}-${origName}`;

      await s3.send(new PutObjectCommand({
        Bucket:      S3_BUCKET,
        Key:         key,
        Body:        buffer,
        ContentType: contentType,
        ACL:         'public-read' as any,
      }));

      const url = publicUrl(key);
      return reply.send({ url, key, fileName: origName, size: buffer.length, contentType });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ error: err.message || 'Upload failed' });
    }
  });
}
