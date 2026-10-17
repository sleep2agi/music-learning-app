import { describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import { APP_VERSION } from '../version.ts'
import {
  UPDATE_ROOT,
  assetUrl,
  checksumMatches,
  checksumUrl,
  compareVersions,
  detectUpdatePlatform,
  digestSha256,
  isNewerRemote,
  parseSha256Sums,
  parseVersion,
  versionUrl,
} from './source.ts'

describe('update source', () => {
  it('builds ModelScope latest URLs for each platform', () => {
    expect(versionUrl()).toBe(`${UPDATE_ROOT}/VERSION`)
    expect(checksumUrl()).toBe(`${UPDATE_ROOT}/SHA256SUMS`)
    expect(assetUrl('android')).toBe(`${UPDATE_ROOT}/lequdao-debug.apk`)
    expect(assetUrl('web')).toBe(`${UPDATE_ROOT}/lequdao-web.zip`)
    expect(assetUrl('mac')).toBe(`${UPDATE_ROOT}/lequdao-mac.dmg`)
    expect(assetUrl('windows')).toBe(`${UPDATE_ROOT}/lequdao-windows.exe`)
  })

  it('parses and compares dotted versions numerically', () => {
    expect(parseVersion('0.2.0\n')).toBe('0.2.0')
    expect(parseVersion('v0.3.0')).toBe('0.3.0')
    expect(parseVersion('latest')).toBeNull()
    expect(compareVersions('0.2.0', '0.3.0')).toBe(-1)
    expect(compareVersions('0.3.0', '0.3.0')).toBe(0)
    expect(compareVersions('0.10.0', '0.9.1')).toBe(1)
    expect(isNewerRemote('0.3.0', '0.2.0')).toBe(false)
    expect(isNewerRemote('0.2.0', '0.3.0')).toBe(true)
  })

  it('reads SHA256SUMS lines and checks a known digest', async () => {
    const sums = [
      '13a0ba4256605ab32b9da6765d240cb4835578669c284a82975ee24bc6d0059e  lequdao-debug.apk',
      '245916812d5992d5baee142f6d6dd1014608e254934259ae26d709f962712a81  lequdao-web.zip',
    ].join('\n')
    expect(parseSha256Sums(sums)['lequdao-web.zip']).toBe(
      '245916812d5992d5baee142f6d6dd1014608e254934259ae26d709f962712a81',
    )
    const actual = await digestSha256(new TextEncoder().encode('abc'))
    expect(actual).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(checksumMatches(`${actual}  note.txt`, 'note.txt', actual)).toBe(true)
    expect(checksumMatches(sums, 'missing.bin', actual)).toBe(false)
  })

  it('picks the download for desktop, Android, or the web bundle', () => {
    expect(detectUpdatePlatform({ desktop: 'darwin', capacitor: 'web' })).toBe('mac')
    expect(detectUpdatePlatform({ desktop: 'win32' })).toBe('windows')
    expect(detectUpdatePlatform({ capacitor: 'android' })).toBe('android')
    expect(detectUpdatePlatform({ capacitor: 'web' })).toBe('web')
  })

  it('keeps the packaged version in one place', () => {
    expect(pkg.version).toBe(APP_VERSION)
  })
})