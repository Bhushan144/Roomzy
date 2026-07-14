import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

export class GeminiProvider {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.AI_PROVIDER_KEY });
    // Using flash model for lower latency and cost
    this.modelName = 'gemini-2.5-flash'; 
  }

  async evaluateLifestyle(tenantProfile, targetProfile) {
    const prompt = `
      You are an expert flatmate compatibility analyzer. Evaluate the lifestyle harmony between two potential flatmates.
      DO NOT evaluate budget or location (that is handled by our deterministic rule engine).
      Focus entirely on human habits: cleanliness, schedule, sociability, and pets.

      Tenant 1 Profile:
      - Cleanliness: ${tenantProfile.lifestyleTraits.cleanliness}
      - Schedule: ${tenantProfile.lifestyleTraits.schedule}
      - Sociability: ${tenantProfile.lifestyleTraits.sociability}
      - Pet Friendly: ${tenantProfile.lifestyleTraits.petFriendly}
      - Bio: "${tenantProfile.bio || 'N/A'}"

      Tenant 2 Profile:
      - Cleanliness: ${targetProfile.lifestyleTraits.cleanliness}
      - Schedule: ${targetProfile.lifestyleTraits.schedule}
      - Sociability: ${targetProfile.lifestyleTraits.sociability}
      - Pet Friendly: ${targetProfile.lifestyleTraits.petFriendly}
      - Bio: "${targetProfile.bio || 'N/A'}"

      Return ONLY a valid JSON object with exact keys:
      {
        "aiScore": <number 0-100 representing lifestyle harmony>,
        "reason": "<A 2-sentence explanation of why they would or would not live well together>",
        "confidence": <number 0.0-1.0 representing how confident you are in this assessment>
      }
    `;

    return this.executePrompt(prompt);
  }

  async evaluateRoomFit(tenantProfile, roomListing) {
    const prompt = `
      You are a real estate compatibility analyzer. Evaluate how well a tenant's lifestyle fits a specific property.
      DO NOT evaluate budget or location. Focus on amenities, space, and lifestyle fit.

      Tenant Profile:
      - Schedule: ${tenantProfile.lifestyleTraits.schedule}
      - Sociability: ${tenantProfile.lifestyleTraits.sociability}
      - Pet Friendly: ${tenantProfile.lifestyleTraits.petFriendly}
      - Bio: "${tenantProfile.bio || 'N/A'}"

      Property Listing:
      - Type: ${roomListing.roomType}
      - Amenities: ${roomListing.amenities.join(', ')}
      - Description: "${roomListing.description || 'N/A'}"

      Return ONLY a valid JSON object with exact keys:
      {
        "aiScore": <number 0-100 representing spatial/lifestyle fit>,
        "reason": "<A 2-sentence explanation of why this property suits their lifestyle>",
        "confidence": <number 0.0-1.0>
      }
    `;

    return this.executePrompt(prompt);
  }

  async executePrompt(prompt) {
    const startTime = Date.now();
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2 // Low temperature for deterministic JSON output
        }
      });

      const latencyMs = Date.now() - startTime;
      const parsedData = JSON.parse(response.text);

      return {
        ...parsedData,
        provider: this.modelName,
        latencyMs,
        isFallback: false
      };
    } catch (error) {
      logger.error('Gemini Provider execution failed', error);
      // Fallback response so the worker doesn't crash the pipeline
      return {
        aiScore: 50,
        reason: "AI evaluation unavailable. Base score applied.",
        confidence: 0.0,
        provider: 'fallback-engine',
        latencyMs: Date.now() - startTime,
        isFallback: true
      };
    }
  }
}