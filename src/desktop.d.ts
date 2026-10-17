export {}

declare global {
  interface Window {
    lequdaoDesktop?: {
      platform: string
      fetchText?: (url: string) => Promise<string>
      fetchBytes?: (url: string) => Promise<string>
    }
  }
}
