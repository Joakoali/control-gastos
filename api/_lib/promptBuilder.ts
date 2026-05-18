interface Expense {
  name: string;
  amount: number;
  category?: string;
  date?: string;
}

interface FixedExpense {
  name: string;
  amount: number;
  category?: string;
}

interface IncomeSource {
  name: string;
  amount: number | string;
}

interface MonthData {
  incomeSources?: IncomeSource[];
  savings?: number;
  expenses?: Expense[];
  fixedExpenses?: FixedExpense[];
}

interface HouseholdRaw {
  code: string;
  fixedExpenses?: FixedExpense[];
  months?: Record<string, MonthData>;
}

export interface HouseholdPayload {
  householdId: string;
  data: HouseholdRaw;
}

function sanitizeMonths(months: Record<string, MonthData>): Record<string, object> {
  const result: Record<string, object> = {};
  for (const [key, m] of Object.entries(months)) {
    result[key] = {
      incomeSources: (m.incomeSources ?? []).map(({ name, amount }) => ({ name, amount: Number(amount) })),
      savings: m.savings ?? 0,
      fixedExpenses: (m.fixedExpenses ?? []).map(({ name, amount, category }) => ({
        name, amount, ...(category ? { category } : {}),
      })),
      expenses: (m.expenses ?? []).map(({ name, amount, category, date }) => ({
        name, amount, ...(category ? { category } : {}), ...(date ? { date } : {}),
      })),
    };
  }
  return result;
}

export function buildSystemPrompt(payload: HouseholdPayload): string {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

  const compactData = {
    household: payload.householdId,
    currentMonth,
    currency: 'EUR',
    fixedExpensesGlobal: (payload.data.fixedExpenses ?? []).map(({ name, amount, category }) => ({
      name, amount, ...(category ? { category } : {}),
    })),
    months: sanitizeMonths(payload.data.months ?? {}),
  };

  const dataJson = JSON.stringify(compactData);

  return `Sos un asistente financiero personal que analiza los gastos de un hogar.
Hablás español rioplatense, sos conciso y directo. Mostrás números concretos.

[FECHA ACTUAL]
${now.toISOString().split('T')[0]}

[DATOS DEL HOGAR]
${dataJson}

[INSTRUCCIONES DE FORMATO]
- Respondé en español, tono cercano pero profesional.
- Sé conciso. Preferí bullets cortos y números a párrafos largos.
- Cuando muestres datos cuantitativos (rankings, comparativas, distribuciones), USÁ un bloque \`\`\`chart en vez de tablas markdown.
- Formato exacto del chart:
  \`\`\`chart
  {"type": "bar"|"compare"|"donut", "title": "...", "data": [...] | "labels"+"series", "format": "currency"|"percent"|"number"}
  \`\`\`
- Tipos soportados (no inventés otros):
  • "bar": {data: [{label, value}, ...]}
  • "compare": {labels: [...], series: [{name, values}, ...]}
  • "donut": {data: [{label, value}, ...]}
- Si te preguntan algo fuera de finanzas personales, redirigí amablemente.
- Si no tenés data suficiente para responder, decilo en vez de inventar.
- Currency = EUR (€). Toda cifra en euros salvo que se especifique otra.

[EJEMPLO]
Pregunta: "¿En qué gasté más en abril?"
Respuesta:
En abril 2026 tus 3 mayores gastos fueron:

\`\`\`chart
{"type":"bar","title":"Top gastos — Abril 2026","data":[{"label":"Súper","value":480.50},{"label":"Resto/Bar","value":245.00},{"label":"Nafta","value":180.00}],"format":"currency"}
\`\`\`

El súper se llevó el 54% del gasto variable. Subió un 12% vs marzo.`;
}
