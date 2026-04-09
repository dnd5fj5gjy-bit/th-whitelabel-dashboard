// AI helper — calls Claude claude-sonnet-4-20250514 via Anthropic Messages API

import storage from './storage.js';

const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';

export async function askClaude(systemPrompt, userMessage, maxTokens = 1024) {
  const settings = storage.get('settings', {});
  const apiKey = settings.apiKey;

  if (!apiKey) {
    throw new Error('No API key configured. Go to Settings to add your Anthropic API key.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function generateOutreach(partner) {
  const system = `You are a business development specialist for Ted's Health, a men's health brand backed by Bear Grylls Ventures. You write concise, professional outreach emails to potential white-label partners. Keep emails under 200 words. Be direct and value-focused.`;

  const prompt = `Write an initial outreach email to ${partner.name} (${partner.category}, operating mode: ${partner.operatingMode}).
${partner.contactName ? `Contact: ${partner.contactName}${partner.contactJobTitle ? ` (${partner.contactJobTitle})` : ''}` : 'No specific contact yet.'}
${partner.edStatus ? 'They offer ED treatments.' : ''} ${partner.trtStatus ? 'They offer TRT.' : ''}
Score: ${partner.score}/100. Wave: ${partner.wave}.
${partner.notes ? `Notes: ${partner.notes}` : ''}

Write a compelling but brief email proposing a white-label partnership. Focus on mutual value.`;

  return askClaude(system, prompt, 512);
}

export async function generateAISummary(partner) {
  const system = `You are an AI assistant for Ted's Health CRM. Analyze the partner interaction history and provide a brief summary with a recommended next action. Be specific and actionable. Keep it under 150 words.`;

  const interactionText = partner.interactions.length > 0
    ? partner.interactions.map(i =>
      `[${i.date}] ${i.type}: ${i.subject}${i.outcome ? ` — Outcome: ${i.outcome}` : ''}${i.nextAction ? ` — Next: ${i.nextAction}` : ''}`
    ).join('\n')
    : 'No interactions recorded yet.';

  const prompt = `Partner: ${partner.name}
Category: ${partner.category}
Operating Mode: ${partner.operatingMode}
Pipeline Stage: ${partner.pipelineStage}
Score: ${partner.score}/100
Wave: ${partner.wave}
Agreement Status: ${partner.agreementStatus}
ED: ${partner.edStatus ? 'Yes' : 'No'} | TRT: ${partner.trtStatus ? 'Yes' : 'No'}

Interaction History:
${interactionText}

Provide a brief summary and recommended next action.`;

  return askClaude(system, prompt, 512);
}
