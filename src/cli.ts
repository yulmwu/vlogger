import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import path from 'path'

export interface CliOptions {
    help: boolean
    username?: string
    slug?: string
    output?: string
    cdnBaseUrl?: string
    images?: boolean
    metadata?: boolean
    json?: boolean
    datePrefix?: boolean
    clean?: boolean
    s3Upload?: boolean
    s3Bucket?: string
    s3Retain?: number
}

export const parseCli = (argv: string[]): { options: CliOptions; errors: string[] } => {
    const parser = yargs(hideBin(['node', 'script', ...argv]))
        .help('help')
        .alias('help', 'h')
        .strict(false)
        .exitProcess(false)
        .parserConfiguration({
            'strip-aliased': true,
        })
        .option('username', {
            type: 'string',
            describe: 'Velog username (or env VELOG_USERNAME)',
        })
        .option('slug', {
            type: 'string',
            describe: 'Backup only one post by slug',
        })
        .option('output', {
            type: 'string',
            describe: 'Output directory (default: ./backup)',
            coerce: (value: string) => path.resolve(value),
        })
        .option('images', {
            type: 'boolean',
            default: true,
            describe: 'Include images',
        })
        .option('metadata', {
            type: 'boolean',
            default: true,
            describe: 'Write frontmatter',
        })
        .option('json', {
            type: 'boolean',
            default: true,
            describe: 'Write _output.json',
        })
        .option('date-prefix', {
            type: 'boolean',
            default: true,
            describe: 'Prefix filenames with date',
        })
        .option('cdn-base-url', {
            type: 'string',
            describe: 'Replace image URLs with CDN base when images are off',
        })
        .option('clean', {
            type: 'boolean',
            default: true,
            describe: 'Clean output directory first',
        })
        .option('s3-upload', {
            type: 'boolean',
            default: false,
            describe: 'Upload zip to S3',
        })
        .option('s3-bucket', {
            type: 'string',
            describe: 'S3 bucket (or env AWS_S3_BUCKET_NAME)',
        })
        .option('s3-retain', {
            type: 'number',
            default: 5,
            describe: 'Retain last N zips in bucket',
        })

    const parsed = parser.parseSync()

    const errors: string[] = []
    if (typeof parsed.s3Retain === 'number' && parsed.s3Retain < 0) {
        errors.push('Invalid value for --s3-retain')
    }

    return {
        options: {
            help: !!parsed.help,
            username: parsed.username as string | undefined,
            slug: parsed.slug as string | undefined,
            output: parsed.output as string | undefined,
            cdnBaseUrl: parsed.cdnBaseUrl as string | undefined,
            images: parsed.images as boolean | undefined,
            metadata: parsed.metadata as boolean | undefined,
            json: parsed.json as boolean | undefined,
            datePrefix: parsed.datePrefix as boolean | undefined,
            clean: parsed.clean as boolean | undefined,
            s3Upload: parsed.s3Upload as boolean | undefined,
            s3Bucket: parsed.s3Bucket as string | undefined,
            s3Retain: parsed.s3Retain as number | undefined,
        },
        errors,
    }
}

export const printHelp = () => {
    const helpText = `velog-backup

Usage:
  node dist/index.js [options]

Options:
  --username <name>        Velog username (or env VELOG_USERNAME)
  --slug <slug>            Backup only one post by slug
  --output <path>          Output directory (default: ./backup)
  --images / --no-images   Include images (default: true)
  --metadata / --no-metadata  Write frontmatter (default: true)
  --json / --no-json       Write _output.json (default: true)
  --date-prefix / --no-date-prefix  Prefix filenames with date (default: true)
  --cdn-base-url <url>     Replace image URLs with CDN base when images are off
  --clean / --no-clean     Clean output directory first (default: true)
  --s3-upload / --no-s3-upload  Upload zip to S3 (default: false)
  --s3-bucket <name>       S3 bucket (or env AWS_S3_BUCKET_NAME)
  --s3-retain <n>          Retain last N zips in bucket (default: 5)
  --help, -h               Show help
`

    console.log(helpText)
}
