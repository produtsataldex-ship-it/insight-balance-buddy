const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(v: number | string, hide = false) {
  if (hide) return "R$ ••••";
  return brl.format(Number(v) || 0);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", opts);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export const FREQ_LABEL: Record<string, string> = { weekly: "Semanal", monthly: "Mensal", yearly: "Anual" };
export const TYPE_LABEL: Record<string, string> = { income: "Receita", expense: "Despesa", transfer: "Transferência" };
export const PAYMENT_METHODS = ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Boleto", "Transferência"];
