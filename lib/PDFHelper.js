import pdf from 'html-pdf';

const componentToPDFBuffer = (component) => {
  return new Promise((resolve, reject) => {
    // const html = renderToStaticMarkup(component);

    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: '10mm',
      footer: {
        height: '10mm',
      },
      type: 'pdf',
      quality: 100,
      timeout: 30000,
    };

    pdf.create(component, options).toBuffer((err, buffer) => {
      if (err) {
        return reject(err);
      }

      return resolve(buffer);
    });
  });
}

export default componentToPDFBuffer;