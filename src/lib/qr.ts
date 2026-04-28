import QRCode from "qrcode";

export async function generateTicketQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });
}
