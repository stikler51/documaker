import componentToPDFBuffer from "../../lib/PDFHelper";

export default async (req, res) => {
  const buffer = await componentToPDFBuffer(req.body);

  // with this header, your browser will prompt you to download the file
  // without this header, your browse will open the pdf directly
  res.setHeader('Content-disposition', 'attachment; filename="article.pdf');

  // set content type
  res.setHeader('Content-Type', 'application/pdf');

  // output the pdf buffer. once res.end is triggered, it won't trigger the render method
  res.end(buffer);
}
