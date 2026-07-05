// Compiles a plain-text template body into the branded HTML shell used across
// all New Empire Remodeling emails, so editors never touch raw markup.
export function buildEmailHtml({ bodyText, imageUrl }: { bodyText: string; imageUrl?: string | null }): string {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  const imageBlock = imageUrl
    ? `<tr><td align="center" style="padding-bottom:20px;"><img src="${imageUrl}" alt="" width="100%" style="max-width:540px;border-radius:8px;display:block;"></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;padding:20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:#1a1a2e;padding:24px 32px;"><h2 style="margin:0;color:#ffffff;font-size:20px;">🏠 New Empire Remodeling</h2></td></tr>
<tr><td style="padding:32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
${imageBlock}
<tr><td>${paragraphs}</td></tr>
</table>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:12px;color:#94a3b8;">
New Empire Remodeling &middot; Jacksonville, FL &middot; <a href="mailto:newempireusavps@gmail.com" style="color:#94a3b8;">newempireusavps@gmail.com</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}
