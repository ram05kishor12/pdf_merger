"use server";

import { PDFDocument } from "pdf-lib";

export async function splitPDF(file: File, pageToSplit: number) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  const totalPages = pdf.getPageCount();

  if (pageToSplit <= 0 || pageToSplit >= totalPages) {
    throw new Error("Invalid split page number");
  }

  const firstPdf = await PDFDocument.create();
  const secondPdf = await PDFDocument.create();

  // Pages for first half (0 to pageToSplit - 1)
  const firstPages = await firstPdf.copyPages(pdf, [...Array(pageToSplit).keys()]);
  firstPages.forEach((page) => firstPdf.addPage(page));

  // Pages for second half (pageToSplit to end)
  const secondPages = await secondPdf.copyPages(
    pdf,
    [...Array(totalPages - pageToSplit).keys()].map((i) => i + pageToSplit)
  );
  secondPages.forEach((page) => secondPdf.addPage(page));

  // Save both PDFs
  const firstBytes = await firstPdf.save();
  const secondBytes = await secondPdf.save();

  // Return as arrays instead of Blobs
  return {
    firstPart: Array.from(firstBytes),
    secondPart: Array.from(secondBytes),
  };
}