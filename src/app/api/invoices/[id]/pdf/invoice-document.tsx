import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  meta: { fontSize: 10, color: "#555", marginBottom: 16 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 6 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingVertical: 6, fontWeight: 700 },
  colDescription: { flex: 3 },
  colBasis: { flex: 2 },
  colDetail: { flex: 2 },
  colAmount: { flex: 1, textAlign: "right" },
  totalsRow: { flexDirection: "row", paddingVertical: 4 },
  totalsLabel: { flex: 7, textAlign: "right", paddingRight: 8 },
  totalsValue: { flex: 1, textAlign: "right" },
});

export type InvoicePdfData = {
  invoiceNumber: string;
  status: string;
  clientName: string;
  fileNumber: string | null;
  branchName: string;
  subtotal: number;
  total: number;
  lineItems: {
    description: string;
    feeBasis: string;
    rate: number | null;
    hours: number | null;
    amount: number;
  }[];
};

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice {data.invoiceNumber}</Text>
        <Text style={styles.meta}>
          Client: {data.clientName}
          {data.fileNumber ? `  |  File: ${data.fileNumber}` : ""}
          {"  |  Branch: "}
          {data.branchName}
          {"  |  Status: "}
          {data.status.toUpperCase()}
        </Text>

        <View style={styles.headerRow}>
          <Text style={styles.colDescription}>Description</Text>
          <Text style={styles.colBasis}>Fee basis</Text>
          <Text style={styles.colDetail}>Rate x Hours</Text>
          <Text style={styles.colAmount}>Amount</Text>
        </View>

        {data.lineItems.map((item, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.colDescription}>{item.description}</Text>
            <Text style={styles.colBasis}>{item.feeBasis.replace(/_/g, " ")}</Text>
            <Text style={styles.colDetail}>
              {item.feeBasis === "hourly" ? `${item.rate} x ${item.hours}` : "-"}
            </Text>
            <Text style={styles.colAmount}>{item.amount.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>{data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Total</Text>
          <Text style={styles.totalsValue}>{data.total.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  );
}
