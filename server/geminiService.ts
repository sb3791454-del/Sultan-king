import { GoogleGenAI } from '@google/genai';
import { IndicatorData, TradeSetup } from '../src/types';

export class GeminiTradingAssistant {
  private static aiClient: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI | null {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.aiClient;
  }

  /**
   * Synthesizes quantitative trade engine metrics into beginner-friendly explanations and Telegram cards.
   * STRICT BOUNDARY: The quantitative numbers (Entry, SL, TP, RR, Confluence) are calculated by the deterministic
   * engine and CANNOT be recalculated or altered by the AI layer.
   */
  public static async synthesizeTradeSetup(
    rawSetup: Omit<TradeSetup, 'aiExplanation' | 'telegramFormattedCard'>,
    indicators: IndicatorData,
    userCustomQuery?: string
  ): Promise<TradeSetup> {
    const ai = this.getClient();

    // Default deterministic fallback explanation if AI is offline or key not supplied
    const defaultExplanation = {
      headline: `${rawSetup.action === 'LONG' ? '🟢 High Confluence Long' : rawSetup.action === 'SHORT' ? '🔴 High Confluence Short' : '🟡 Neutral / Sideways Range'} on ${rawSetup.symbol} (${rawSetup.timeframe})`,
      simpleRationale: rawSetup.action === 'NEUTRAL'
        ? `Market momentum is currently conflicting or range-bound (${indicators.rsiSignal}, ${indicators.emaTrend.replace(/_/g, ' ')}). No statistical edge exists for active risk.`
        : `Trend momentum is aligning with ${indicators.emaTrend.replace(/_/g, ' ')} structure. RSI is at ${indicators.rsi14.toFixed(1)} with ${indicators.macd.crossover.replace(/_/g, ' ')} momentum.`,
      stepByStepPlan: rawSetup.action === 'NEUTRAL'
        ? [
            `1. Stand by: No active position recommended on ${rawSetup.symbol}.`,
            `2. Wait for a clean structural break above ${indicators.swingHigh} or below ${indicators.swingLow}.`,
            `3. Re-scan markets with /scan to locate high-confluence setups across other assets.`,
          ]
        : [
            `1. Wait for price to enter ${rawSetup.entryZone[0]} - ${rawSetup.entryZone[1]} zone.`,
            `2. Place initial Stop-Loss strictly at ${rawSetup.stopLoss} (${rawSetup.riskPercent}% risk).`,
            `3. When TP1 (${rawSetup.takeProfit1}) is reached, secure 50% profit and move Stop-Loss to Entry (Break-even).`,
            `4. Let runners aim for TP2 (${rawSetup.takeProfit2}) and TP3 (${rawSetup.takeProfit3}).`,
          ],
      invalidationTrigger: rawSetup.action === 'NEUTRAL'
        ? `Consolidation range remains until volume displacement breaks key support or resistance.`
        : `A ${rawSetup.timeframe} candle closing ${rawSetup.action === 'LONG' ? 'below' : 'above'} ${rawSetup.stopLoss} immediately cancels this trade setup.`,
      riskManagementTip: `Never risk more than 1-2% of your total portfolio balance on this single trade. Capital preservation is priority #1.`,
    };

    let aiExplanation = defaultExplanation;

    if (ai) {
      const candidateModels = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
      const prompt = `You are a disciplined quantitative trading analyst and coach.
STRICT RULE: The mathematical numbers below are calculated by the deterministic quantitative engine. You MUST NOT alter, recalculate, or hallucinate different price levels, targets, or risk percentages.

MATHEMATICAL TRADE FACTS:
Symbol: ${rawSetup.symbol} (${rawSetup.name})
Asset Type: ${rawSetup.assetType}
Timeframe: ${rawSetup.timeframe}
Action: ${rawSetup.action}
Confluence Score: ${rawSetup.confluenceScore}/10 (${rawSetup.probabilityRating})
Current Live Price: ${rawSetup.currentPrice}
Entry Zone: ${rawSetup.entryZone[0]} - ${rawSetup.entryZone[1]}
Stop Loss: ${rawSetup.stopLoss} (${rawSetup.riskPercent}% risk)
Take Profit 1: ${rawSetup.takeProfit1}
Take Profit 2: ${rawSetup.takeProfit2}
Take Profit 3: ${rawSetup.takeProfit3}
Risk to Reward: ${rawSetup.riskRewardRatio}
Technical Metrics:
- Trend: ${rawSetup.technicalSummary.trend}
- RSI: ${rawSetup.technicalSummary.rsiStatus}
- MACD: ${rawSetup.technicalSummary.macdStatus}
- Volatility: ${rawSetup.technicalSummary.volatilityStatus}
- Support: ${rawSetup.technicalSummary.support} | Resistance: ${rawSetup.technicalSummary.resistance}
${userCustomQuery ? `User Question: "${userCustomQuery}"` : ''}

Respond with a JSON object strictly following this structure:
{
  "headline": "Punchy 1-sentence trade summary",
  "simpleRationale": "Explain in 2 simple sentences why this setup has a statistical edge (or why to stay out if NEUTRAL), so even a beginner understands.",
  "stepByStepPlan": [
    "Step 1 entry trigger",
    "Step 2 stop loss position",
    "Step 3 taking partial profit & break-even move",
    "Step 4 trail target"
  ],
  "invalidationTrigger": "Exact condition when this idea is invalidated",
  "riskManagementTip": "1 golden rule for capital preservation on this pair"
}`;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            aiExplanation = {
              headline: parsed.headline || defaultExplanation.headline,
              simpleRationale: parsed.simpleRationale || defaultExplanation.simpleRationale,
              stepByStepPlan: Array.isArray(parsed.stepByStepPlan) && parsed.stepByStepPlan.length > 0 ? parsed.stepByStepPlan : defaultExplanation.stepByStepPlan,
              invalidationTrigger: parsed.invalidationTrigger || defaultExplanation.invalidationTrigger,
              riskManagementTip: parsed.riskManagementTip || defaultExplanation.riskManagementTip,
            };
            break;
          }
        } catch (err: any) {
          console.warn(`Gemini synthesis with ${model} failed (${err?.message}), attempting fallback...`);
        }
      }
    }

    // Build standard Telegram formatted card
    const telegramCard = this.formatTelegramMessage(rawSetup, indicators, aiExplanation);

    return {
      ...rawSetup,
      aiExplanation,
      telegramFormattedCard: telegramCard,
    };
  }

  /**
   * Answers natural language Telegram questions
   */
  public static async answerGeneralTradingQuery(userQuery: string, marketContext?: string): Promise<string> {
    const ai = this.getClient();
    if (!ai) {
      return `📊 <b>Trading Assistant Response</b>\n\nI received your query: <i>"${userQuery}"</i>.\n\nTo generate a live trade setup, type <code>/setup XAUUSD</code>, <code>/setup BTC</code>, or <code>/scan</code> to check all high-probability market opportunities!`;
    }

    const candidateModels = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
    const prompt = `You are a private AI Trading Assistant on Telegram. The user asked: "${userQuery}".
${marketContext ? `Live Market Context: ${marketContext}` : ''}

Respond in concise, crisp, professional Telegram HTML formatting (using <b>bold</b>, <code>code</code>, and bullet points).
Keep the tone confident, disciplined, beginner-friendly, and always prioritize risk management.
If they asked for an asset recommendation, give them clear instructions on how to use /setup or /scan.`;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        if (response.text) {
          return response.text;
        }
      } catch (e: any) {
        console.warn(`Query answer failed with ${model} (${e?.message}), attempting fallback...`);
      }
    }

    return `📊 <b>Trading Assistant Response</b>\n\nI processed your request for <i>"${userQuery}"</i>.\n\nType <code>/setup XAUUSD</code> for Gold, <code>/setup BTC 1h</code> for Bitcoin, or <code>/scan</code> to view current confluence setups across all assets.`;
  }

  /**
   * Formats the signal card cleanly for Telegram
   */
  public static formatTelegramMessage(
    setup: Omit<TradeSetup, 'aiExplanation' | 'telegramFormattedCard'>,
    indicators: IndicatorData,
    ai: TradeSetup['aiExplanation']
  ): string {
    const actionEmoji = setup.action === 'LONG' ? '🟢 <b>LONG / BUY</b>' : setup.action === 'SHORT' ? '🔴 <b>SHORT / SELL</b>' : '🟡 <b>STANDBY / NEUTRAL</b>';
    const scoreStars = '⭐'.repeat(Math.min(5, Math.ceil(setup.confluenceScore / 2)));

    return `🔥 <b>TRADING ASSISTANT SIGNAL | ${setup.symbol} (${setup.timeframe.toUpperCase()})</b>
━━━━━━━━━━━━━━━━━━━━
🎯 <b>Action:</b> ${actionEmoji}
📊 <b>Confluence Score:</b> ${setup.confluenceScore}/10 ${scoreStars}
💎 <b>Setup Quality:</b> <code>${setup.probabilityRating.replace(/_/g, ' ')}</code>

💰 <b>Live Price:</b> <code>$${setup.currentPrice.toLocaleString()}</code>
📥 <b>Optimal Entry Zone:</b> <code>$${setup.entryZone[0].toLocaleString()} - $${setup.entryZone[1].toLocaleString()}</code>
🛑 <b>Stop-Loss (SL):</b> <code>$${setup.stopLoss.toLocaleString()}</code> (-${setup.riskPercent}%)
⚖️ <b>Risk-to-Reward (R:R):</b> <code>${setup.riskRewardRatio}</code>

🎯 <b>TAKE PROFIT TARGETS:</b>
  • <b>TP 1 (50% close):</b> <code>$${setup.takeProfit1.toLocaleString()}</code> (Move SL to Break-Even)
  • <b>TP 2 (30% close):</b> <code>$${setup.takeProfit2.toLocaleString()}</code>
  • <b>TP 3 (20% runner):</b> <code>$${setup.takeProfit3.toLocaleString()}</code>

🧠 <b>AI CONFLUENCE REASONING:</b>
${ai.simpleRationale}

📋 <b>EXECUTION PLAN:</b>
${ai.stepByStepPlan.map((s) => `• ${s}`).join('\n')}

⚠️ <b>INVALIDATION:</b>
${ai.invalidationTrigger}

🛡️ <b>RISK RULE:</b>
${ai.riskManagementTip}
━━━━━━━━━━━━━━━━━━━━
<i>Generated at ${new Date().toLocaleTimeString()} UTC • Quantitative + Gemini Engine</i>`;
  }
}
