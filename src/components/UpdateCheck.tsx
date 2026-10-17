import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { APP_VERSION } from '../version.ts'
import {
  PLATFORM_ASSET,
  PLATFORM_LABEL,
  assetUrl,
  checksumMatches,
  checksumUrl,
  detectUpdatePlatform,
  digestSha256,
  isNewerRemote,
  parseVersion,
  versionUrl,
  type UpdatePlatform,
} from '../update/source.ts'

type Phase = 'idle' | 'loading' | 'current' | 'ahead' | 'available' | 'invalid' | 'offline'
type Verify = 'idle' | 'working' | 'ok' | 'bad' | 'opened'

function currentPlatform(): UpdatePlatform {
  return detectUpdatePlatform({
    desktop: window.lequdaoDesktop?.platform,
    capacitor: Capacitor.getPlatform(),
  })
}

async function readText(url: string): Promise<string> {
  if (window.lequdaoDesktop?.fetchText) return window.lequdaoDesktop.fetchText(url)
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(String(response.status))
  return response.text()
}

async function readBytes(url: string): Promise<ArrayBuffer> {
  if (window.lequdaoDesktop?.fetchBytes) {
    const encoded = await window.lequdaoDesktop.fetchBytes(url)
    const binary = atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes.buffer
  }
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(String(response.status))
  return response.arrayBuffer()
}

function saveFile(bytes: ArrayBuffer, name: string) {
  const blob = new Blob([bytes])
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = name
  link.click()
  URL.revokeObjectURL(objectUrl)
}

export function UpdateCheck() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [remote, setRemote] = useState('')
  const [verify, setVerify] = useState<Verify>('idle')
  const platform = currentPlatform()
  const fileName = PLATFORM_ASSET[platform]
  const downloadUrl = assetUrl(platform)

  async function check() {
    setOpen(true)
    setPhase('loading')
    setVerify('idle')
    try {
      const parsed = parseVersion(await readText(versionUrl()))
      if (!parsed) {
        setPhase('invalid')
        return
      }
      setRemote(parsed)
      if (parsed === APP_VERSION) setPhase('current')
      else if (isNewerRemote(APP_VERSION, parsed)) setPhase('available')
      else setPhase('ahead')
    } catch {
      setPhase('offline')
    }
  }

  async function download() {
    setVerify('working')
    try {
      const sums = await readText(checksumUrl())
      const bytes = await readBytes(downloadUrl)
      const actual = await digestSha256(bytes)
      if (!checksumMatches(sums, fileName, actual)) {
        setVerify('bad')
        return
      }
      saveFile(bytes, fileName)
      setVerify('ok')
    } catch {
      window.open(downloadUrl, '_blank', 'noopener')
      setVerify('opened')
    }
  }

  return (
    <>
      <button type="button" className="update-open" onClick={() => void check()}>
        检查更新
      </button>
      {open && (
        <div className="update-layer" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="update-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="row-head">
              <h2 id="update-title">检查更新</h2>
              <button type="button" className="ghost" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
            <p>当前版本 {APP_VERSION}</p>
            {phase === 'loading' && <p>正在查看 ModelScope 上的版本…</p>}
            {phase === 'offline' && <p>暂时连不上更新源。可以稍后再试。</p>}
            {phase === 'invalid' && <p>更新源里的版本号无法识别。</p>}
            {phase === 'current' && <p>已是最新版本。</p>}
            {phase === 'ahead' && <p>这台是 {APP_VERSION}，更新源还是 {remote}。</p>}
            {phase === 'available' && (
              <>
                <p>
                  发现新版本 {remote}。当前是 {APP_VERSION}。可下载{PLATFORM_LABEL[platform]}。
                </p>
                {(platform === 'mac' || platform === 'windows') && (
                  <p className="update-note">
                    安装包未签名。Mac 可能被系统拦截，Windows 可能出现 SmartScreen 提示，需要在系统里允许打开。
                  </p>
                )}
                {platform === 'web' && <p className="update-note">网页里提供的是压缩包，解压后用浏览器打开。</p>}
                <button type="button" className="primary" onClick={() => void download()} disabled={verify === 'working'}>
                  {verify === 'working' ? '正在下载并校验…' : '下载并校验'}
                </button>
                {verify === 'ok' && <p className="feedback is-good">SHA256 校验通过，已开始保存。</p>}
                {verify === 'bad' && <p className="feedback is-bad">SHA256 不一致，没有保存文件。</p>}
                {verify === 'opened' && <p>页面内下载失败，已打开下载链接。</p>}
                <p>
                  <a href={downloadUrl} target="_blank" rel="noreferrer">
                    {fileName}
                  </a>
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}
