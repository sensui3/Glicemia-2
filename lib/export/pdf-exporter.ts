import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConditionLabel, groupReadingsByDate } from "@/lib/glucose-utils"
import { getMedicationTypeLabel } from "@/lib/types"

const generateChartImage = async (readings: any[]): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas")
        canvas.width = 800
        canvas.height = 400
        const ctx = canvas.getContext("2d")

        if (!ctx) {
            resolve("")
            return
        }

        // Ordenar readings do mais antigo para o mais recente para o gráfico
        const sortedReadings = [...readings].sort((a, b) => {
            const dateA = new Date(`${a.reading_date}T${a.reading_time}`)
            const dateB = new Date(`${b.reading_date}T${b.reading_time}`)
            return dateA.getTime() - dateB.getTime()
        })

        // Configuração do gráfico
        const padding = 60
        const graphWidth = canvas.width - padding * 2
        const graphHeight = canvas.height - padding * 2

        // Fundo branco
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Encontrar min e max para escala
        const values = sortedReadings.map((r) => r.reading_value)
        // Ajuste: começar do zero como parâmetro
        const minValue = 0
        const maxValue = Math.max(...values, 140)
        const valueRange = maxValue - minValue

        // Desenhar grade
        ctx.strokeStyle = "#e5e7eb"
        ctx.lineWidth = 1
        for (let i = 0; i <= 5; i++) {
            const y = padding + (graphHeight / 5) * i
            ctx.beginPath()
            ctx.moveTo(padding, y)
            ctx.lineTo(canvas.width - padding, y)
            ctx.stroke()

            // Labels do eixo Y
            const value = maxValue - (valueRange / 5) * i
            ctx.fillStyle = "#6b7280"
            ctx.font = "12px Arial"
            ctx.textAlign = "right"
            ctx.fillText(Math.round(value).toString(), padding - 10, y + 5)
        }

        // Desenhar linhas de referência
        const drawReferenceLine = (value: number, color: string, label: string) => {
            const y = padding + graphHeight - ((value - minValue) / valueRange) * graphHeight
            // Só desenhar se estiver dentro da escala
            if (y >= padding && y <= padding + graphHeight) {
                ctx.strokeStyle = color
                ctx.setLineDash([5, 5])
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(padding, y)
                ctx.lineTo(canvas.width - padding, y)
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = color
                ctx.font = "10px Arial"
                ctx.textAlign = "left"
                ctx.fillText(label, padding + 5, y - 5)
            }
        }

        drawReferenceLine(70, "#22c55e", "Mín. Normal (70)")
        drawReferenceLine(99, "#22c55e", "Máx. Normal (99)")
        drawReferenceLine(140, "#f59e0b", "Atenção (140)")

        // Desenhar linha do gráfico
        if (sortedReadings.length > 0) {
            ctx.strokeStyle = "#0f766e"
            ctx.lineWidth = 3
            ctx.beginPath()

            sortedReadings.forEach((reading, index) => {
                const x = padding + (graphWidth / (sortedReadings.length - 1 || 1)) * index
                const y = padding + graphHeight - ((reading.reading_value - minValue) / valueRange) * graphHeight

                if (index === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            })

            ctx.stroke()

            // Desenhar pontos
            sortedReadings.forEach((reading, index) => {
                const x = padding + (graphWidth / (sortedReadings.length - 1 || 1)) * index
                const y = padding + graphHeight - ((reading.reading_value - minValue) / valueRange) * graphHeight

                ctx.fillStyle = "#0f766e"
                ctx.beginPath()
                ctx.arc(x, y, 4, 0, Math.PI * 2)
                ctx.fill()
            })

            // Desenhar labels do eixo X (Período)
            // Escolher alguns pontos para mostrar a data
            const numLabels = 5
            const step = Math.ceil((sortedReadings.length - 1) / (numLabels - 1)) || 1

            ctx.fillStyle = "#6b7280"
            ctx.font = "10px Arial"
            ctx.textAlign = "center"

            sortedReadings.forEach((reading, index) => {
                // Mostrar o primeiro, o último, e alguns intermediários
                if (index === 0 || index === sortedReadings.length - 1 || index % step === 0) {
                    const x = padding + (graphWidth / (sortedReadings.length - 1 || 1)) * index
                    const dateLabel = format(new Date(reading.reading_date), "dd/MM")
                    ctx.fillText(dateLabel, x, canvas.height - padding + 15)
                }
            })
        }

        // Eixos
        ctx.strokeStyle = "#374151"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, padding)
        ctx.lineTo(padding, canvas.height - padding)
        ctx.lineTo(canvas.width - padding, canvas.height - padding)
        ctx.stroke()

        // Labels dos eixos
        ctx.fillStyle = "#374151"
        ctx.font = "14px Arial"
        ctx.textAlign = "center"
        ctx.fillText("mg/dL", padding / 2, padding - 20)
        ctx.fillText("Período", canvas.width / 2, canvas.height - padding / 3 + 20)

        resolve(canvas.toDataURL("image/png"))
    })
}

export const exportAsPDF = async (readings: any[], medications: any[], limits: any, startDate: Date, endDate: Date) => {
    const avgGlucose =
        readings.length > 0 ? (readings.reduce((sum: number, r: any) => sum + r.reading_value, 0) / readings.length).toFixed(1) : "0"

    const maxGlucose = readings.length > 0 ? Math.max(...readings.map((r: any) => r.reading_value)) : 0
    const minGlucose = readings.length > 0 ? Math.min(...readings.map((r: any) => r.reading_value)) : 0

    const hypo = limits?.hypo_limit ?? 70
    const fastingMax = limits?.fasting_max ?? 99
    const postMealMax = limits?.post_meal_max ?? 140

    const normalCount = readings.filter((r: any) => r.reading_value >= hypo && r.reading_value <= fastingMax).length
    const highCount = readings.filter((r: any) => r.reading_value > postMealMax).length
    const lowCount = readings.filter((r: any) => r.reading_value < hypo).length

    const chartImageData = await generateChartImage(readings)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Glicemia</title>
          <style>
            @page { margin: 1cm; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 20px;
              color: #333;
            }
            .header {
              border-bottom: 3px solid #0f766e;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            h1 { 
              color: #0f766e; 
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            h2 {
              color: #0f766e;
              font-size: 18px;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .period { 
              color: #666; 
              font-size: 14px;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 30px 0;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #0f766e;
            }
            .stat-unit {
              font-size: 12px;
              color: #94a3b8;
            }
            .medications-section {
              margin: 30px 0;
              padding: 20px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .medication-item {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 10px;
            }
            .medication-name {
              font-weight: 600;
              color: #0f766e;
              font-size: 14px;
            }
            .medication-details {
              color: #64748b;
              font-size: 12px;
              margin-top: 5px;
            }
            .chart-container {
              margin: 30px 0;
              text-align: center;
              page-break-inside: avoid;
            }
            .chart-container img {
              max-width: 100%;
              height: auto;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .chart-title {
              font-size: 16px;
              font-weight: 600;
              color: #0f766e;
              margin-bottom: 15px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 13px;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 10px 12px; 
              text-align: left; 
            }
            th { 
              background-color: #0f766e; 
              color: white; 
              font-weight: 600;
            }
            tr:nth-child(even) { 
              background-color: #f8fafc; 
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
            }
            .status-normal { background: #dcfce7; color: #166534; }
            .status-alto { background: #fee2e2; color: #991b1b; }
            .status-baixo { background: #fef3c7; color: #92400e; }
            .status-atencao { background: #fed7aa; color: #9a3412; }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              font-size: 11px; 
              color: #64748b; 
              page-break-inside: avoid;
            }
            .footer p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório de Controle de Glicemia</h1>
            <p class="period">
              Período: <strong>${format(startDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong> até 
              <strong>${format(endDate!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
            </p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Média</div>
              <div class="stat-value">${avgGlucose} <span class="stat-unit">mg/dL</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Maior Leitura</div>
              <div class="stat-value">${maxGlucose} <span class="stat-unit">mg/dL</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Menor Leitura</div>
              <div class="stat-value">${minGlucose} <span class="stat-unit">mg/dL</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Registros</div>
              <div class="stat-value">${readings.length}</div>
            </div>
          </div>
          
          ${medications.length > 0
            ? `
          <div class="medications-section">
            <h2>💊 Medicações de Uso Contínuo</h2>
            ${medications
                .map((med: any) => {
                    const type = getMedicationTypeLabel(med.medication_type) || "Outro"
                    const dosage = `${med.continuous_dosage || med.dosage} ${med.continuous_dosage_unit || med.dosage_unit}`
                    const notes = med.notes ? ` <br/><span style="font-style:italic">Obs: ${med.notes}</span>` : ""
                    return `
                  <div class="medication-item">
                    <div class="medication-name">${med.medication_name}</div>
                    <div class="medication-details">
                      ${type} • ${dosage}${notes}
                    </div>
                  </div>
                `
                })
                .join("")}
          </div>
          `
            : ""
        }
          
          ${chartImageData
            ? `
          <div class="chart-container">
            <div class="chart-title">Gráfico de Evolução da Glicemia</div>
            <img src="${chartImageData}" alt="Gráfico de Glicemia" />
          </div>
          `
            : ""
        }
          
          <h2>📋 Histórico de Leituras</h2>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Condição</th>
                <th>Glicemia</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${readings
            .map((r: any) => {
                const value = r.reading_value
                const hypo = limits?.hypo_limit ?? 70
                const fastingMax = limits?.fasting_max ?? 99
                const postMealMax = limits?.post_meal_max ?? 140

                let statusClass = "status-normal"
                let statusText = "Normal"

                if (value < hypo) {
                    statusClass = "status-baixo"
                    statusText = "Baixo"
                } else if (value > postMealMax) {
                    statusClass = "status-alto"
                    statusText = "Alto"
                } else if (value > fastingMax) {
                    statusClass = "status-atencao"
                    statusText = "Atenção"
                }

                return `
                    <tr>
                      <td>${format(new Date(r.reading_date), "dd/MM/yyyy")}</td>
                      <td>${r.reading_time.slice(0, 5)}</td>
                      <td>${getConditionLabel(r.condition)}</td>
                      <td><strong>${r.reading_value} mg/dL</strong></td>
                      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                      <td>${r.observations || "-"}</td>
                    </tr>
                  `
            })
            .join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p><strong>Distribuição dos Resultados:</strong></p>
            <p>✅ Normais (${hypo}-${fastingMax} mg/dL): ${normalCount} leitura(s) - ${readings.length > 0 ? ((normalCount / readings.length) * 100).toFixed(1) : 0}%</p>
            <p>⚠️ Altos (&gt;${postMealMax} mg/dL): ${highCount} leitura(s) - ${readings.length > 0 ? ((highCount / readings.length) * 100).toFixed(1) : 0}%</p>
            <p>⬇️ Baixos (&lt;${hypo} mg/dL): ${lowCount} leitura(s) - ${readings.length > 0 ? ((lowCount / readings.length) * 100).toFixed(1) : 0}%</p>
            <p style="margin-top: 20px;">
              <strong>Relatório gerado em:</strong> ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
            </p>
            <p style="margin-top: 10px; font-style: italic;">
              Valores de referência em jejum: ${hypo}-${fastingMax} mg/dL (Normal) | ${fastingMax + 1}-125 mg/dL (Pré-diabetes) | ≥126 mg/dL (Diabetes)
            </p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
        }, 500)
    }
}

export const exportMedicalPDF = async (readings: any[], medications: any[], limits: any, startDate: Date, endDate: Date, hba1cValue: string) => {
    const avgGlucose =
        readings.length > 0 ? (readings.reduce((sum: number, r: any) => sum + r.reading_value, 0) / readings.length).toFixed(1) : "0"

    const groupedReadings = groupReadingsByDate(readings) as any[]

    const chartImageData = await generateChartImage(readings)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Diário de Glicemia</title>
          <style>
            @page { margin: 1cm; margin-top: 2cm; size: landscape; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 20px;
              color: #333;
            }
            .header {
              border-bottom: 3px solid #0f766e;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            h1 { 
              color: #0f766e; 
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .period { 
              color: #666; 
              font-size: 14px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 13px;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 12px;
              text-align: center; 
            }
            th { 
              background-color: #0f766e; 
              color: white; 
              font-weight: 600;
              padding: 12px;
            }
            tr:nth-child(even) { 
              background-color: #f8fafc; 
            }
            .cell-value {
              font-weight: bold;
              display: block;
              margin-bottom: 2px;
              font-size: 14px;
            }
            .cell-status {
              font-size: 9px;
              padding: 2px 4px;
              border-radius: 4px;
              display: inline-block;
            }
            .bg-low { background-color: #fef3c7; color: #92400e; }
            .bg-normal { background-color: #dcfce7; color: #166534; }
            .bg-attention { background-color: #fed7aa; color: #9a3412; }
            .bg-high { background-color: #fee2e2; color: #991b1b; }
            
            .medications-section {
              margin-top: 30px;
              padding: 15px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .layout-table {
              width: 100%;
              border: none;
              margin-bottom: 30px;
              border-collapse: collapse;
            }
            .layout-table td {
              border: none;
              padding: 0;
              vertical-align: top;
            }
            .stats-box {
               background: #f8fafc;
               border: 1px solid #e2e8f0;
               border-radius: 8px;
               padding: 20px;
               text-align: center;
               height: 100%;
               display: flex;
               flex-direction: column;
               justify-content: center;
               align-items: center;
               box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Diário de Glicemia</h1>
            <p class="period">
              Período: <strong>${format(startDate!, "dd/MM/yyyy")}</strong> até 
              <strong>${format(endDate!, "dd/MM/yyyy")}</strong> | Média: ${avgGlucose} mg/dL
            </p>
          </div>

          ${chartImageData
            ? `
          <table class="layout-table">
            <tr>
              <td style="padding-right: 20px; width: 75%;">
                 <img src="${chartImageData}" style="width: 100%; height: auto; max-height: 350px; border: 1px solid #e2e8f0; border-radius: 8px;" />
              </td>
              <td style="width: 25%;">
                 <div class="stats-box">
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 10px; font-weight: 600;">HbA1c Estimada</div>
                    <div style="font-size: 42px; font-weight: bold; color: #7e22ce;">${hba1cValue}%</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 5px;">Baseado nos últimos 3 meses</div>
                 </div>
              </td>
            </tr>
          </table>
          `
            : ""
        }

          <table>
            <thead>
              <tr>
                <th style="width: 100px; text-align: left;">Data</th>
                <th>Jejum</th>
                <th>2h Pós Café</th>
                <th>Antes Almoço</th>
                <th>2h Pós Almoço</th>
                <th>Antes Jantar</th>
                <th>2h Pós Jantar</th>
                <th>Madrugada</th>
              </tr>
            </thead>
            <tbody>
              ${groupedReadings
            .map((day: any) => {
                const getCellHtml = (reading: any) => {
                    if (!reading) return "-"
                    const val = reading.reading_value
                    const hypo = limits?.hypo_limit ?? 70
                    const fastingMax = limits?.fasting_max ?? 99
                    const postMealMax = limits?.post_meal_max ?? 140

                    let cls = "bg-normal"
                    if (val < hypo) cls = "bg-low"
                    else if (val > postMealMax) cls = "bg-high"
                    else if (val > fastingMax) cls = "bg-attention"

                    return `
                      <div>
                        <span class="cell-value">${val}</span>
                      </div>
                    `
                }

                const getCellStyle = (reading: any) => {
                    if (!reading) return "";
                    const val = reading.reading_value;
                    const hypo = limits?.hypo_limit ?? 70
                    const fastingMax = limits?.fasting_max ?? 99
                    const postMealMax = limits?.post_meal_max ?? 140

                    if (val < hypo) return "background-color: #fffbeb;";
                    if (val <= fastingMax) return "background-color: #f0fdf4;";
                    if (val <= postMealMax) return "background-color: #fff7ed;";
                    return "background-color: #fef2f2;";
                }

                return `
                    <tr>
                      <td style="text-align: left; font-weight: bold;">
                        ${format(new Date(day.date), "dd/MM")} <span style="font-weight: normal; color: #666; font-size: 11px;">${format(new Date(day.date), "EEE", { locale: ptBR })}</span>
                      </td>
                      <td style="${getCellStyle(day.jejum)}">${getCellHtml(day.jejum)}</td>
                      <td style="${getCellStyle(day.posCafe)}">${getCellHtml(day.posCafe)}</td>
                      <td style="${getCellStyle(day.preAlmoco)}">${getCellHtml(day.preAlmoco)}</td>
                      <td style="${getCellStyle(day.posAlmoco)}">${getCellHtml(day.posAlmoco)}</td>
                      <td style="${getCellStyle(day.preJantar)}">${getCellHtml(day.preJantar)}</td>
                      <td style="${getCellStyle(day.posJantar)}">${getCellHtml(day.posJantar)}</td>
                      <td style="${getCellStyle(day.madrugada)}">${getCellHtml(day.madrugada)}</td>
                    </tr>
                  `
            })
            .join("")}
            </tbody>
          </table>
          
          ${medications.length > 0
            ? `
          <div class="medications-section">
            <h3 style="color: #0f766e; margin-top: 0;">💊 Medicações</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            ${medications
                .map((med: any) => {
                    const type = getMedicationTypeLabel(med.medication_type) || "Outro"
                    const dosage = `${med.continuous_dosage || med.dosage} ${med.continuous_dosage_unit || med.dosage_unit}`
                    const notes = med.notes ? ` - Obs: ${med.notes}` : ""
                    return `<li><strong>${med.medication_name}</strong> (${type}) - ${dosage}${notes}</li>`
                })
                .join("")}
            </ul>
          </div>
          `
            : ""
        }
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
        }, 500)
    }
}
