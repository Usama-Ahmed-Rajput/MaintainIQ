'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Printer, Loader2 } from 'lucide-react'

interface QrCodeDisplayProps {
  assetCode: string
  assetName: string
}

export default function QrCodeDisplay({ assetCode, assetName }: QrCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')

  useEffect(() => {
    const publicUrl = `${window.location.origin}/asset/${assetCode}`
    setUrl(publicUrl)

    if (!canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, publicUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(() => setLoading(false))
  }, [assetCode])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return

    // Draw a labelled print-quality version
    const printCanvas = document.createElement('canvas')
    printCanvas.width = 340
    printCanvas.height = 400
    const ctx = printCanvas.getContext('2d')!

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 340, 400)

    // Border
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 320, 380)

    // Title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('MaintainIQ', 170, 45)

    // Asset name
    ctx.font = '13px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#6b7280'
    const truncName = assetName.length > 30 ? assetName.slice(0, 30) + '…' : assetName
    ctx.fillText(truncName, 170, 68)

    // QR code centred
    ctx.drawImage(canvas, 60, 85, 220, 220)

    // Asset code
    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = '#111827'
    ctx.fillText(assetCode, 170, 330)

    // Instruction
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText('Scan to report a maintenance issue', 170, 352)
    ctx.fillText(url, 170, 372)

    const link = document.createElement('a')
    link.download = `QR-${assetCode}.png`
    link.href = printCanvas.toDataURL('image/png')
    link.click()
  }

  function handlePrint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>QR Label – ${assetCode}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
            .label { border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; width: 300px; }
            .brand { font-weight: 700; font-size: 18px; color: #111827; margin-bottom: 4px; }
            .name { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
            img { width: 200px; height: 200px; display: block; margin: 0 auto 16px; }
            .code { font-family: monospace; font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 8px; }
            .hint { font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="brand">MaintainIQ</div>
            <div class="name">${assetName}</div>
            <img src="${dataUrl}" />
            <div class="code">${assetCode}</div>
            <div class="hint">Scan to report a maintenance issue</div>
          </div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500) }<\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative bg-white p-4 rounded-xl border border-border shadow-sm">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        <canvas ref={canvasRef} className="block" />
      </div>

      <div className="text-center">
        <p className="text-xs font-mono font-bold text-foreground">{assetCode}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px] break-all">{url}</p>
      </div>

      <div className="flex gap-2 w-full max-w-[220px]">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-lg px-3 py-2 text-xs font-semibold hover:bg-muted transition disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <button
          onClick={handlePrint}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" /> Print Label
        </button>
      </div>
    </div>
  )
}
