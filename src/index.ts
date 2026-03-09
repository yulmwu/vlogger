import process from 'process'
import { parseCli, printHelp } from './cli'
import { resolveConfig, validateConfig } from './config'
import { runBackup } from './backup'

export const handler = async () => {
    const { options, errors: cliErrors } = parseCli(process.argv.slice(2))

    if (options.help) {
        printHelp()
        return
    }

    if (cliErrors.length > 0) {
        cliErrors.forEach((error) => console.error(error))
        printHelp()
        process.exit(1)
    }

    console.log('Starting Velog backup with options:', options)

    const config = resolveConfig(options)
    const configErrors = validateConfig(config)

    if (configErrors.length > 0) {
        configErrors.forEach((error) => console.error(error))
        process.exit(1)
    }

    if (!process.env.VELOG_JWT_ACCESS_TOKEN) {
        console.warn('VELOG_JWT_ACCESS_TOKEN is not set; requests may fail.')
    }

    await runBackup(config)
}

handler().catch((err) => {
    console.error(`Error during backup: ${err.message}`)
    process.exit(1)
})
