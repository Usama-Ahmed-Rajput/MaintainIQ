import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { Asset, Issue } from './types'

export async function exportAssetMaintenanceHistoryPDF(
  asset: Asset,
  issues: Issue[],
  filename: string = `${asset.code}-maintenance-history.pdf`,
) {
  const doc = new jsPDF()
  let yPos = 20

  // Header
  doc.setFontSize(16)
  doc.text(`Maintenance History Report`, 20, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos)
  yPos += 7
  doc.text(`Asset: ${asset.name} (${asset.code})`, 20, yPos)
  yPos += 7
  doc.text(`Category: ${asset.category}`, 20, yPos)
  yPos += 7
  doc.text(`Location: ${asset.location}`, 20, yPos)
  yPos += 10

  // Asset Details
  doc.setFontSize(11)
  doc.text('Asset Details', 20, yPos)
  yPos += 6

  doc.setFontSize(9)
  const assetDetails = [
    [`Serial Number:`, asset.serial_number || 'N/A'],
    [`Model:`, asset.model || 'N/A'],
    [`Condition:`, asset.condition],
    [`Status:`, asset.status],
    [`Last Service:`, asset.last_service_date ? new Date(asset.last_service_date).toLocaleDateString() : 'N/A'],
    [`Next Service:`, asset.next_service_date ? new Date(asset.next_service_date).toLocaleDateString() : 'N/A'],
  ]

  assetDetails.forEach(([label, value]) => {
    doc.text(`${label}`, 25, yPos)
    doc.text(`${value}`, 80, yPos)
    yPos += 5
  })

  yPos += 5

  // Issues/Maintenance Records
  if (issues.length > 0) {
    doc.setFontSize(11)
    doc.text('Maintenance Records', 20, yPos)
    yPos += 6

    issues.forEach((issue, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(9)
      doc.setTextColor(0, 102, 204)
      doc.text(`#${index + 1} - ${issue.title}`, 20, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 5

      const issueInfo = [
        [`Issue #:`, issue.issue_number],
        [`Priority:`, issue.priority],
        [`Category:`, issue.category],
        [`Status:`, issue.status],
        [`Reporter:`, issue.reporter_name],
        [`Date Reported:`, new Date(issue.created_at).toLocaleDateString()],
      ]

      issueInfo.forEach(([label, value]) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(8)
        doc.text(`${label} ${value}`, 25, yPos)
        yPos += 4
      })

      if (issue.inspection_findings) {
        yPos += 2
        doc.setFontSize(8)
        doc.text('Inspection Findings:', 25, yPos)
        yPos += 3
        const wrappedText = doc.splitTextToSize(issue.inspection_findings, 160)
        doc.setFontSize(7)
        wrappedText.forEach(line => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 30, yPos)
          yPos += 3
        })
      }

      if (issue.work_performed) {
        yPos += 2
        doc.setFontSize(8)
        doc.text('Work Performed:', 25, yPos)
        yPos += 3
        const wrappedText = doc.splitTextToSize(issue.work_performed, 160)
        doc.setFontSize(7)
        wrappedText.forEach(line => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 30, yPos)
          yPos += 3
        })
      }

      yPos += 5
    })
  } else {
    doc.setFontSize(9)
    doc.text('No maintenance records found.', 20, yPos)
  }

  doc.save(filename)
}

export async function exportDashboardSnapshot(elementId: string, filename: string = 'dashboard-snapshot.pdf') {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  const canvas = await html2canvas(element, { backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const doc = new jsPDF('p', 'mm', 'a4')

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const imgWidth = pageWidth - 20
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight

  let position = 10
  doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
  heightLeft -= pageHeight - 20

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    doc.addPage()
    doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20
  }

  doc.save(filename)
}
