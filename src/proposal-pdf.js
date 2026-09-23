/** Capture the screen design, section by section, without invoking print CSS. */
export async function downloadProposalPDF(html, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'), import('jspdf'),
  ]);
  const frame = document.createElement('iframe');
  frame.title = 'Preparação do PDF';
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.style.cssText = 'position:fixed;left:-12000px;top:0;width:1120px;height:900px;border:0;pointer-events:none;';
  try {
    const ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('A proposta demorou para carregar. Tente novamente.')), 30000);
      frame.onload = () => { clearTimeout(timer); resolve(); };
    });
    frame.srcdoc = html;
    document.body.append(frame);
    await ready;
    const doc = frame.contentDocument;
    await doc.fonts.ready;
    await Promise.all([...doc.images].map(img => img.decode()));
    let pdf;
    const sections = [...doc.querySelector('main').children];
    for (const section of sections) {
      const canvas = await html2canvas(section, {
        scale: 1.5, backgroundColor: '#f6f6f4', logging: false,
        windowWidth: 1120, windowHeight: 900,
      });
      const width = 297;
      const height = Math.max(30, canvas.height / canvas.width * width);
      const orientation = height > width ? 'portrait' : 'landscape';
      if (!pdf) pdf = new jsPDF({ unit: 'mm', format: [width, height], orientation, compress: true });
      else pdf.addPage([width, height], orientation);
      pdf.addImage(canvas.toDataURL('image/jpeg', .95), 'JPEG', 0, 0, width, height);
      canvas.width = canvas.height = 0;
    }
    if (!pdf) throw new Error('A proposta está vazia.');
    pdf.setProperties({ title: filename, creator: 'Project Lab' });
    pdf.save(filename + '.pdf');
  } finally { frame.remove(); }
}
