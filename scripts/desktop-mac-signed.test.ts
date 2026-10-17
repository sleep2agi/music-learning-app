import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const script = join(root, 'scripts', 'desktop-mac-signed.mjs')
const sentinel = 'SENTINEL_CSC_LINK_VALUE'

function runSigned(env: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  })
}

describe('desktop:mac:signed', () => {
  it('stops before building when signing env is missing and does not print values', () => {
    const result = runSigned({ CSC_LINK: sentinel })
    expect(result.status).not.toBe(0)
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    expect(output).toContain('CSC_KEY_PASSWORD')
    expect(output).toContain('APPLE_API_KEY')
    expect(output).toContain('APPLE_API_KEY_ID')
    expect(output).toContain('APPLE_API_ISSUER')
    expect(output).toContain('APPLE_TEAM_ID')
    expect(output).not.toContain(sentinel)
  })

  it('rejects an APPLE_API_KEY that is not a .p8 path', () => {
    const result = runSigned({
      CSC_LINK: sentinel,
      CSC_KEY_PASSWORD: 'secret-password',
      APPLE_API_KEY: join(root, 'missing-auth-key.p8'),
      APPLE_API_KEY_ID: 'KEYID',
      APPLE_API_ISSUER: 'issuer',
      APPLE_TEAM_ID: 'TEAMID',
    })
    expect(result.status).not.toBe(0)
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    expect(output).toContain('AuthKey .p8')
    expect(output).not.toContain(sentinel)
    expect(output).not.toContain('secret-password')
  })

  it('refuses pull_request jobs before invoking electron-builder', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lequdao-sign-'))
    const keyPath = join(dir, 'AuthKey.p8')
    writeFileSync(keyPath, 'not-a-real-key\n')
    try {
      const result = runSigned({
        CSC_LINK: sentinel,
        CSC_KEY_PASSWORD: 'secret-password',
        APPLE_API_KEY: keyPath,
        APPLE_API_KEY_ID: 'KEYID',
        APPLE_API_ISSUER: 'issuer',
        APPLE_TEAM_ID: 'TEAMID',
        GITHUB_BASE_REF: 'main',
      })
      expect(result.status).not.toBe(0)
      const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
      expect(output).toContain('GITHUB_BASE_REF')
      expect(output).not.toContain(sentinel)
      expect(output).not.toContain('packaging')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('unsigned Mac CI', () => {
  it('keeps discovery off and configures hardened runtime notarization from env', () => {
    const builder = readFileSync(join(root, 'electron-builder.yml'), 'utf8')
    const ci = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8')
    const pkg = readFileSync(join(root, 'package.json'), 'utf8')
    expect(builder).not.toContain('identity: null')
    expect(builder).toContain('hardenedRuntime: true')
    expect(builder).toContain('notarize: true')
    expect(builder).toContain('build/entitlements.mac.plist')
    expect(builder).toContain('build/entitlements.mac.inherit.plist')
    expect(builder).toContain('signAndEditExecutable: false')
    expect(readFileSync(join(root, 'build/entitlements.mac.plist'), 'utf8')).toContain(
      'com.apple.security.network.client',
    )
    expect(ci).toContain('CSC_IDENTITY_AUTO_DISCOVERY: false')
    expect(pkg).toContain('desktop:mac:signed')
  })
})
