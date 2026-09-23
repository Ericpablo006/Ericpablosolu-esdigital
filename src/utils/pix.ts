// Gerador de "PIX Copia e Cola" (BR Code / EMV®) para cobranças com valor definido.
// Especificação: Manual do BR Code do Banco Central.

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF) */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const ascii = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .trim();

export type PixInput = {
  key: string;
  receiverName: string;
  city: string;
  amountCents?: number;
  txid?: string;
  description?: string;
};

export function buildPixPayload({ key, receiverName, city, amountCents, txid, description }: PixInput): string {
  const gui = tlv("00", "br.gov.bcb.pix");
  const account =
    gui + tlv("01", key.trim()) + (description ? tlv("02", ascii(description).slice(0, 40)) : "");
  const cleanTxid = (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  let payload =
    tlv("00", "01") +
    tlv("01", amountCents ? "12" : "11") +
    tlv("26", account) +
    tlv("52", "0000") +
    tlv("53", "986");
  if (amountCents && amountCents > 0) payload += tlv("54", (amountCents / 100).toFixed(2));
  payload +=
    tlv("58", "BR") +
    tlv("59", (ascii(receiverName) || "RECEBEDOR").slice(0, 25)) +
    tlv("60", (ascii(city) || "SAO PAULO").slice(0, 15)) +
    tlv("62", tlv("05", cleanTxid));
  payload += "6304";
  return payload + crc16(payload);
}
