export const UPDATE_DATASET = 'https://modelscope.cn/datasets/SmartFlowAI/music-learning-app'
export const UPDATE_ROOT = `${UPDATE_DATASET}/resolve/master/latest`

export type UpdatePlatform = 'android' | 'web' | 'mac' | 'windows'

export const PLATFORM_ASSET: Record<UpdatePlatform, string> = {
  android: 'lequdao-debug.apk',
  web: 'lequdao-web.zip',
  mac: 'lequdao-mac.dmg',
  windows: 'lequdao-windows.exe',
}

export const PLATFORM_LABEL: Record<UpdatePlatform, string> = {
  android: 'Android 安装包',
  web: '网页压缩包',
  mac: 'Mac 安装镜像',
  windows: 'Windows 安装程序',
}

export function versionUrl(root = UPDATE_ROOT): string {
  return `${root}/VERSION`
}

export function checksumUrl(root = UPDATE_ROOT): string {
  return `${root}/SHA256SUMS`
}

export function assetUrl(platform: UpdatePlatform, root = UPDATE_ROOT): string {
  return `${root}/${PLATFORM_ASSET[platform]}`
}

export function assertUpdateUrl(url: string, root = UPDATE_ROOT): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('invalid update url')
  }
  const allowed = new URL(root.endsWith('/') ? root : `${root}/`)
  if (parsed.origin !== allowed.origin || !parsed.pathname.startsWith(allowed.pathname)) {
    throw new Error('unexpected update url')
  }
}

export function parseVersion(text: string): string | null {
  const match = /^\s*v?(\d+)\.(\d+)\.(\d+)\s*$/.exec(text)
  if (!match) return null
  return `${match[1]}.${match[2]}.${match[3]}`
}

/** Negative when local is older than remote. */
export function compareVersions(local: string, remote: string): -1 | 0 | 1 {
  const left = parseVersion(local)
  const right = parseVersion(remote)
  if (!left || !right) throw new Error('invalid version')
  const a = left.split('.').map((part) => Number(part))
  const b = right.split('.').map((part) => Number(part))
  for (let index = 0; index < 3; index += 1) {
    const av = a[index] ?? 0
    const bv = b[index] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

export function isNewerRemote(local: string, remote: string): boolean {
  return compareVersions(local, remote) < 0
}

export function parseSha256Sums(text: string): Record<string, string> {
  const sums: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const match = /^([a-fA-F0-9]{64})\s+\*?(\S+)\s*$/.exec(line.trim())
    const hash = match?.[1]
    const name = match?.[2]
    if (!hash || !name) continue
    sums[name] = hash.toLowerCase()
  }
  return sums
}

export function checksumMatches(sumsText: string, fileName: string, actualHex: string): boolean {
  const expected = parseSha256Sums(sumsText)[fileName]
  if (!expected) return false
  return expected === actualHex.trim().toLowerCase()
}

export async function digestSha256(bytes: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('')
}

export function detectUpdatePlatform(input: { desktop?: string; capacitor?: string }): UpdatePlatform {
  if (input.desktop === 'darwin') return 'mac'
  if (input.desktop === 'win32') return 'windows'
  if (input.capacitor === 'android') return 'android'
  return 'web'
}
