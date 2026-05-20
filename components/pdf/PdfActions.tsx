"use client";

import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { InvoiceDocument, StatementDocument } from "@/components/pdf/PdfDocuments";
import type { PrintableInvoice, PrintableStatement } from "@/lib/types";

type Props =
  | { kind: "invoice"; data: PrintableInvoice; fileName: string }
  | { kind: "statement"; data: PrintableStatement; fileName: string };

export function PdfActions(props: Props) {
  const document =
    props.kind === "invoice" ? (
      <InvoiceDocument invoice={props.data} />
    ) : (
      <StatementDocument statement={props.data} />
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a className="button-secondary" href="#pdf-preview">
          Preview
        </a>
        <PDFDownloadLink className="button-primary" document={document} fileName={props.fileName}>
          {({ loading }) => (loading ? "Preparing PDF..." : "Print / Download PDF")}
        </PDFDownloadLink>
      </div>
      <div id="pdf-preview" className="h-[720px] overflow-hidden rounded-lg border border-line bg-white">
        <PDFViewer width="100%" height="100%" showToolbar>
          {document}
        </PDFViewer>
      </div>
    </div>
  );
}
