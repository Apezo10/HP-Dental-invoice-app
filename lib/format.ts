export function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function invoiceNumber() {
  const now = new Date();
  const invoiceUnsafeCharacters = new RegExp(["-", ":", "T", "Z", "."].map((char) => `\\${char}`).join("|"), "g");
  const stamp = now
    .toISOString()
    .replace(invoiceUnsafeCharacters, "")
    .slice(0, 14);
  return `INV-${stamp}`;
}

export function statementNumber() {
  const now = new Date();
  const unsafeCharacters = new RegExp(["-", ":", "T", "Z", "."].map((char) => `\\${char}`).join("|"), "g");
  const stamp = now
    .toISOString()
    .replace(unsafeCharacters, "")
    .slice(0, 14);
  return `STMT-${stamp}`;
}

export function businessInfo() {
  return {
    name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "HP Dental",
    address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Business address",
    contact: process.env.NEXT_PUBLIC_BUSINESS_CONTACT || "Phone | Email"
  };
}
