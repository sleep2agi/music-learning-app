#!/usr/bin/env node
/**
 * Build a Developer ID signed, notarized, universal Mac DMG for 乐趣岛.
 *
 * Apple secrets live only in sleep2agi/agent-network-app, environment
 * macos-signing. A workflow there checks out this repo and runs:
 *
 *   npm ci
 *   npm run desktop:mac:signed
 *
 * This script does not read GitHub secrets. The caller exports:
 *
 *   CSC_LINK
 *     Developer ID .p12 path, or the base64-encoded .p12. Secret
 *     APPLE_CERTIFICATE is already base64 and can be passed through as-is.
 *   CSC_KEY_PASSWORD
 *     Password for that .p12. Secret APPLE_CERTIFICATE_PASSWORD.
 *   APPLE_API_KEY
 *     Filesystem path of the AuthKey .p8. Decode secret APPLE_API_KEY_BASE64
 *     into a temp file and set this to that path. This is not the key id.
 *   APPLE_API_KEY_ID
 *     App Store Connect API key id. Secret APPLE_API_KEY.
 *   APPLE_API_ISSUER
 *     App Store Connect issuer id. Secret APPLE_API_ISSUER.
 *   APPLE_TEAM_ID
 *     Apple Developer Team ID. Secret APPLE_TEAM_ID.
 *     electron-builder's API-key notarization uses APPLE_API_KEY,
 *     APPLE_API_KEY_ID, and APPLE_API_ISSUER. It reads APPLE_TEAM_ID for the
 *     Apple ID password flow. This script requires all four.
 *
 * Leave CSC_NAME unset. A value that starts with "Developer ID Application:"
 * is rejected by electron-builder. Do not set CSC_IDENTITY_AUTO_DISCOVERY=false;
 * this script turns discovery on for the build so the certificate in CSC_LINK
 * is selected. Unsigned CI keeps discovery off and does not call this script.
 *
 * Run from workflow_dispatch or a tag checkout. pull_request jobs set
 * GITHUB_BASE_REF, and electron-builder then skips signing.
 *
 * Values of these variables are never printed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const developerId = 'Developer ID Application: wenxing hu (446BLT75JZ)'
const required = [
  'CSC_LINK',
  'CSC_KEY_PASSWORD',
  'APPLE_API_KEY',
  'APPLE_API_KEY_ID',
  'APPLE_API_ISSUER',
  'APPLE_TEAM_ID',
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

function preflight() {
  const missing = required.filter((name) => {
    const value = process.env[name]
    return value == null || value.trim() === ''
  })
  if (missing.length > 0) {
    console.error('desktop:mac:signed needs these environment variables (values are not printed):')
    for (const name of missing) console.error(`  ${name}`)
    process.exit(1)
  }

  if (!existsSync(process.env.APPLE_API_KEY)) {
    fail(
      'APPLE_API_KEY must be the filesystem path of the AuthKey .p8 decoded from APPLE_API_KEY_BASE64. It is the key file, not the key id (that id belongs in APPLE_API_KEY_ID).',
    )
  }

  const cscName = process.env.CSC_NAME?.trim() ?? ''
  if (cscName.startsWith('Developer ID Application:')) {
    fail(
      'Leave CSC_NAME unset. electron-builder rejects a CSC_NAME that includes the "Developer ID Application:" prefix and selects that certificate from CSC_LINK.',
    )
  }

  if ((process.env.GITHUB_BASE_REF ?? '') !== '' && process.env.CSC_FOR_PULL_REQUEST !== 'true') {
    fail(
      'electron-builder skips macOS signing when GITHUB_BASE_REF is set (pull_request jobs). Run npm run desktop:mac:signed from workflow_dispatch or a tag checkout, not a pull request.',
    )
  }

  if (process.platform !== 'darwin') {
    fail('desktop:mac:signed must run on macOS.')
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: 'true',
    },
    stdio: 'inherit',
  })
  if (result.error) fail(result.error.message)
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function findUniversalApp() {
  const dir = join(root, 'release', 'mac-universal')
  let names = []
  try {
    names = readdirSync(dir).filter((name) => name.endsWith('.app'))
  } catch {
    names = []
  }
  if (names.length !== 1) {
    fail(`expected one .app in release/mac-universal, found ${names.length}`)
  }
  return join(dir, names[0])
}

function verify(appPath) {
  const verified = spawnSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
    stdio: 'inherit',
  })
  if (verified.error) fail(verified.error.message)
  if (verified.status !== 0) process.exit(verified.status ?? 1)

  const details = spawnSync('codesign', ['-dv', '--verbose=4', appPath], { encoding: 'utf8' })
  const text = `${details.stdout ?? ''}\n${details.stderr ?? ''}`
  if (!text.includes(`Authority=${developerId}`)) {
    console.error(`codesign Authority does not include ${developerId}`)
    for (const line of text.split('\n')) {
      if (line.startsWith('Authority=') || line.startsWith('Identifier=') || line.startsWith('TeamIdentifier=')) {
        console.error(line)
      }
    }
    process.exit(1)
  }
  console.log(`Signed with ${developerId}`)

  const stapled = spawnSync('xcrun', ['stapler', 'validate', appPath], { stdio: 'inherit' })
  if (stapled.error) fail(stapled.error.message)
  if (stapled.status !== 0) process.exit(stapled.status ?? 1)

  const dmg = join(root, 'release', 'lequdao-mac.dmg')
  if (!existsSync(dmg)) fail('missing release/lequdao-mac.dmg')
  console.log('Stapled app is packaged as release/lequdao-mac.dmg')
}

async function main() {
  preflight()
  // Discovery must stay on in this process. electron-builder ignores CSC_LINK
  // when CSC_IDENTITY_AUTO_DISCOVERY is the string "false".
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'true'
  run('npm', ['run', 'build'])
  const { build } = await import('electron-builder')
  // Pass booleans here. The CLI form --config.forceCodeSigning=true stays a
  // string, and the config schema rejects that.
  await build({
    mac: [],
    universal: true,
    publish: 'never',
    config: {
      forceCodeSigning: true,
      mac: { notarize: true },
    },
  })
  verify(findUniversalApp())
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
