declare module "qrcode" {
  export function toString(
    text: string,
    options?: {
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
      margin?: number;
      type?: "svg" | "utf8" | "terminal";
      width?: number;
      color?: {
        dark?: string;
        light?: string;
      };
    },
  ): Promise<string>;

  export function toDataURL(
    text: string,
    options?: {
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
      margin?: number;
      width?: number;
      color?: {
        dark?: string;
        light?: string;
      };
    },
  ): Promise<string>;
}
