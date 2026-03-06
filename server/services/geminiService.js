import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

/**
 * Gemini AI Service — centralised prompt engineering & API calls.
 * Tries primary model first, falls back to alternative on 503/overload.
 */

let genAI = null;
let model = null;

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

const getModel = (modelName) => {
  if (!genAI) {
    if (!config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here') {
      throw new Error(
        'GEMINI_API_KEY is not configured. Add a valid key to server/.env'
      );
    }
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI.getGenerativeModel({ model: modelName || MODELS[0] });
};

// ─── Helper: call Gemini with automatic fallback ───
const callWithFallback = async (promptFn) => {
  for (const modelName of MODELS) {
    try {
      const ai = getModel(modelName);
      return await promptFn(ai);
    } catch (err) {
      const isOverload = err.status === 503 || err.message?.includes('503') || err.message?.includes('high demand');
      if (isOverload && modelName !== MODELS[MODELS.length - 1]) {
        console.warn(`Model ${modelName} overloaded, falling back to next...`);
        continue;
      }
      throw err;
    }
  }
};

// ─── Helper: call Gemini and parse JSON from response ───
const generateJSON = async (prompt) => {
  return callWithFallback(async (ai) => {
    const result = await ai.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned);
  });
};

const generateText = async (prompt) => {
  return callWithFallback(async (ai) => {
    const result = await ai.generateContent(prompt);
    return result.response.text().trim();
  });
};

// ═══════════════════════════════════════════════════════════
// 1. AI Invoice Generation — text/email → structured invoice
// ═══════════════════════════════════════════════════════════
export const generateInvoiceFromText = async (inputText, senderInfo = {}) => {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are an expert invoice data extractor for a professional invoicing application.

TASK: Parse the following client communication and extract structured invoice data.

CLIENT COMMUNICATION:
"""
${inputText}
"""

SENDER BUSINESS INFO (use as the "from" details if needed):
${senderInfo.businessName ? `Business: ${senderInfo.businessName}` : ''}
${senderInfo.businessEmail ? `Email: ${senderInfo.businessEmail}` : ''}
${senderInfo.businessPhone ? `Phone: ${senderInfo.businessPhone}` : ''}

RULES:
- Extract client name, email, phone, and address from the text where available
- Identify all services/items mentioned with reasonable quantities and rates
- If prices are mentioned, use those exact amounts
- If prices are NOT mentioned, estimate professional market rates in USD
- Set issueDate to "${today}" and dueDate 30 days later
- Set status to "draft"
- Be generous but realistic with rates

Respond ONLY with valid JSON in this exact structure (no markdown, no explanation):
{
  "clientName": "string",
  "clientEmail": "string or empty",
  "clientPhone": "string or empty",
  "clientAddress": "string or empty",
  "items": [
    {
      "description": "string (clear, professional description)",
      "quantity": number,
      "rate": number
    }
  ],
  "taxRate": number (0-20, suggest appropriate tax),
  "discount": number (0 unless mentioned),
  "notes": "string (professional note to client)",
  "terms": "Payment is due within 30 days of invoice date.",
  "summary": "string (1-2 sentence human-readable summary of what was extracted)"
}`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════════
// 2. AI Payment Reminder — invoice data → professional email
// ═══════════════════════════════════════════════════════════
export const generatePaymentReminder = async (invoice, tone = 'professional') => {
  const overdueDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
  );

  const prompt = `You are a professional accounts receivable communication specialist.

TASK: Generate a payment reminder email for an unpaid invoice.

INVOICE DETAILS:
- Invoice Number: ${invoice.invoiceNumber}
- Client Name: ${invoice.clientName}
- Client Email: ${invoice.clientEmail || 'N/A'}
- Total Amount: $${invoice.total}
- Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('en-US')}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-US')}
- Days Overdue: ${overdueDays}
- Status: ${invoice.status}
- Items: ${invoice.items.map((i) => `${i.description} ($${i.amount})`).join(', ')}

TONE: ${tone}
${tone === 'friendly' ? '- Keep it warm, casual, and non-confrontational' : ''}
${tone === 'professional' ? '- Formal, polite, firm but courteous' : ''}
${tone === 'urgent' ? '- Assertive, emphasise overdue status, mention consequences' : ''}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "subject": "string (email subject line)",
  "body": "string (full email body with proper greeting and signature placeholder [Your Name])",
  "tone": "${tone}",
  "overdueDays": ${overdueDays},
  "tips": "string (1-2 tips for the sender on handling this situation)"
}`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════════
// 3. AI Insights — invoice history → business intelligence
// ═══════════════════════════════════════════════════════════
export const generateInsights = async (invoices, stats) => {
  // Build summary data for the AI to analyse
  const invoiceSummary = invoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    client: inv.clientName,
    total: inv.total,
    status: inv.status,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    items: inv.items?.map((i) => i.description).join(', '),
  }));

  const prompt = `You are a senior business intelligence analyst for a freelancer/small business.

TASK: Analyse the invoice data below and provide actionable business insights.

INVOICE DATA (${invoices.length} invoices):
${JSON.stringify(invoiceSummary, null, 2)}

AGGREGATE STATS:
- Total Invoices: ${stats.totalInvoices || invoices.length}
- Total Revenue (paid): $${stats.totalRevenue || 0}
- Pending Amount: $${stats.pendingAmount || 0}
- Status Breakdown: ${JSON.stringify(stats.statusBreakdown || [])}
- Monthly Revenue: ${JSON.stringify(stats.monthlyRevenue || [])}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "revenueTrend": {
    "direction": "up" | "down" | "stable",
    "summary": "string (2-3 sentences about revenue trajectory)",
    "percentage": "string (estimated change like '+15%' or '-8%')"
  },
  "clientPatterns": [
    {
      "insight": "string (one specific client pattern)",
      "action": "string (recommended action)"
    }
  ],
  "paymentHealth": {
    "score": number (1-10, 10 = excellent),
    "summary": "string (2-3 sentences about payment patterns)",
    "riskClients": ["client names with overdue/late patterns"]
  },
  "recommendations": [
    {
      "title": "string (short actionable title)",
      "description": "string (1-2 sentence explanation)",
      "priority": "high" | "medium" | "low",
      "impact": "string (expected benefit)"
    }
  ],
  "funFact": "string (one interesting data point from their invoicing history)"
}`;

  return generateJSON(prompt);
};

export default {
  generateInvoiceFromText,
  generatePaymentReminder,
  generateInsights,
};
