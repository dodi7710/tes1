// Minimal ESC/POS command builder. Targets 32-column thermal paper (58mm) —
// most small BLE thermal printers used by warung-scale POS setups. Adjust
// WIDTH if the real printer uses 80mm (48 columns).
const WIDTH = 32;

const ESC = 0x1b;
const GS = 0x1d;

export class Receipt {
  private chunks: number[] = [];

  constructor() {
    this.chunks.push(ESC, 0x40); // ESC @ — initialize
  }

  private text(s: string) {
    for (const ch of s) this.chunks.push(ch.charCodeAt(0) & 0xff);
  }

  line(s = "") {
    this.text(s);
    this.chunks.push(0x0a);
    return this;
  }

  center(on: boolean) {
    this.chunks.push(ESC, 0x61, on ? 1 : 0);
    return this;
  }

  bold(on: boolean) {
    this.chunks.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  /** Two columns on one line: left-aligned label, right-aligned value. */
  row(left: string, right: string) {
    const space = Math.max(1, WIDTH - left.length - right.length);
    return this.line(left + " ".repeat(space) + right);
  }

  divider(char = "-") {
    return this.line(char.repeat(WIDTH));
  }

  feed(n = 1) {
    for (let i = 0; i < n; i++) this.chunks.push(0x0a);
    return this;
  }

  cut() {
    this.chunks.push(GS, 0x56, 0x01); // GS V 1 — partial cut
    return this;
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.chunks);
  }
}

/** Wrap a long line to the printer width, breaking on word boundaries. */
export function wrap(s: string, width = WIDTH): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > width) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}
