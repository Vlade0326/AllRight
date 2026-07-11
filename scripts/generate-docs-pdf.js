/**
 * Genera PDF desde docs/ALLRIGHT-DOCUMENTACION-TECNICA.md
 * Uso: node scripts/generate-docs-pdf.js
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const mdPath = path.join(root, 'docs', 'ALLRIGHT-DOCUMENTACION-TECNICA.md');
const pdfPath = path.join(root, 'docs', 'ALLRIGHT-DOCUMENTACION-TECNICA.pdf');

if (!fs.existsSync(mdPath)) {
  console.error('No se encontró:', mdPath);
  process.exit(1);
}

console.log('Instalando md-to-pdf (temporal)...');
execSync('npm install md-to-pdf@5.2.4 --no-save', {
  cwd: root,
  stdio: 'inherit',
});

const { mdToPdf } = require('md-to-pdf');

(async () => {
  console.log('Generando PDF...');
  await mdToPdf(
    { path: mdPath },
    {
      dest: pdfPath,
      pdf_options: {
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
        printBackground: true,
      },
      stylesheet: path.join(__dirname, 'pdf-styles.css'),
      launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
    },
  );
  const stat = fs.statSync(pdfPath);
  console.log(`PDF generado: ${pdfPath}`);
  console.log(`Tamaño: ${(stat.size / 1024).toFixed(1)} KB`);
})().catch((err) => {
  console.error('Error generando PDF:', err.message);
  process.exit(1);
});
