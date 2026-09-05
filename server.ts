import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Health & Status
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      server: "Production Budget ERP Server", 
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  app.get("/api/system/status", (_req, res) => {
    res.json({
      status: "online",
      database: "Firebase Firestore Synchronized",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      capabilities: [
        "Firebase Auth (Google SSO)",
        "Cloud Firestore Persistence",
        "Veo Video Generation (Text-to-Video & Image-to-Video)",
        "Google Maps Grounding (Location Scouting & Logistics)",
        "Google Search Grounding (Live Production Rates & Union Scales)",
        "Gemini Image Studio (Create & Edit Concept Art)"
      ]
    });
  });

  // 1. Google Maps Grounding Endpoint (Location Scouting & Logistics)
  app.post("/api/gemini/maps-grounding", async (req, res) => {
    try {
      const { prompt, location = "Mumbai, India", projectType = "Feature Film" } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGeminiClient();
      const systemContext = `You are an expert Hollywood and Bollywood film location manager, production logistics supervisor, and budgeting controller. Provide highly accurate, actionable filming locations, studio complexes, sound stages, and transit logistics. Include practical considerations like parking, generator access, permits, and nearby accommodation.`;

      const fullPrompt = `${systemContext}\n\nProject Type: ${projectType}\nTarget Base Region: ${location}\nUser Request: ${prompt}\n\nPlease recommend suitable locations, nearby studios, and logistics notes with detailed place information.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });

      const text = response.text || "";
      const candidates = response.candidates || [];
      const groundingMetadata = candidates[0]?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks || [];
      const webSearchQueries = groundingMetadata?.webSearchQueries || [];

      // Extract places and maps URLs
      const mapSources: Array<{ title?: string; uri?: string }> = [];
      for (const chunk of groundingChunks) {
        if ((chunk as any).web?.uri) {
          mapSources.push({
            title: (chunk as any).web?.title || "Google Maps Resource",
            uri: (chunk as any).web?.uri
          });
        } else if ((chunk as any).maps?.uri || (chunk as any).maps?.placeId) {
          mapSources.push({
            title: (chunk as any).maps?.title || "Location on Google Maps",
            uri: (chunk as any).maps?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((chunk as any).maps?.title || "Film Studio")}`
          });
        }
      }

      res.json({
        text,
        sources: mapSources,
        webSearchQueries,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Maps Grounding Error]:", err);
      res.status(500).json({ 
        error: err?.message || "Failed to query Google Maps grounding intelligence" 
      });
    }
  });

  // 2. Google Search Grounding Endpoint (Live Market Rates & Industry Benchmarks)
  app.post("/api/gemini/search-grounding", async (req, res) => {
    try {
      const { prompt, category = "Camera & Lighting Equipment", region = "India / Global" } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGeminiClient();
      const systemContext = `You are a Senior Production Controller, Line Producer, and Film Financial Auditor. Provide up-to-date industry rental rates, daily crew wage benchmarks, union union minimums (SAG-AFTRA, IATSE, FWICE, WICA), equipment hire benchmarks (Arri Alexa 35, Sony Venice 2, Cooke lenses, Grip/Genset packages), and tax incentives.`;

      const fullPrompt = `${systemContext}\n\nBudget Category: ${category}\nMarket/Region: ${region}\nUser Query: ${prompt}\n\nSearch live web sources to provide exact current pricing ranges, daily/weekly rates, standard overtime conventions, and source links.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "";
      const candidates = response.candidates || [];
      const groundingMetadata = candidates[0]?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks || [];

      const searchSources: Array<{ title: string; uri: string }> = [];
      for (const chunk of groundingChunks) {
        if ((chunk as any).web?.uri) {
          searchSources.push({
            title: (chunk as any).web?.title || "Industry Web Source",
            uri: (chunk as any).web?.uri
          });
        }
      }

      res.json({
        text,
        sources: searchSources,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Search Grounding Error]:", err);
      res.status(500).json({ 
        error: err?.message || "Failed to query Google Search grounding rates" 
      });
    }
  });

  // 3. Create Images Endpoint (Concept Art, Storyboards, Set Design, Costumes)
  app.post("/api/gemini/image-generate", async (req, res) => {
    try {
      const { prompt, aspectRatio = "16:9", style = "cinematic film still", quality = "high" } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGeminiClient();
      const enhancedPrompt = `${prompt}, ${style}, photorealistic 35mm cinematic film grain, anamorphic lens, master cinematography, 8k resolution concept art`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: enhancedPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) ? aspectRatio : "16:9") as any
          }
        }
      });

      let base64ImageUrl = "";
      let description = "";

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          base64ImageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          description += part.text;
        }
      }

      if (!base64ImageUrl) {
        return res.status(500).json({ 
          error: "Model did not return image data. Response: " + (description || "No content") 
        });
      }

      res.json({
        imageUrl: base64ImageUrl,
        description,
        prompt,
        aspectRatio,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Image Generation Error]:", err);
      res.status(500).json({ 
        error: err?.message || "Failed to generate concept image" 
      });
    }
  });

  // 4. Edit Images Endpoint (Modify Lighting, Mood, Set Elements, Costumes)
  app.post("/api/gemini/image-edit", async (req, res) => {
    try {
      const { imageBase64, editPrompt, mimeType = "image/png" } = req.body;
      if (!imageBase64 || !editPrompt) {
        return res.status(400).json({ error: "imageBase64 and editPrompt are required" });
      }

      // Strip data URL prefix if present
      const rawBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: rawBase64,
                mimeType: mimeType
              }
            },
            {
              text: `Edit and transform this film production image: ${editPrompt}. Maintain high visual quality and cinematic aesthetic.`
            }
          ]
        }
      });

      let updatedImageUrl = "";
      let description = "";

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          updatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          description += part.text;
        }
      }

      if (!updatedImageUrl) {
        return res.status(500).json({ 
          error: "Model did not return edited image data. Response: " + (description || "No content") 
        });
      }

      res.json({
        imageUrl: updatedImageUrl,
        description,
        editPrompt,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Image Edit Error]:", err);
      res.status(500).json({ 
        error: err?.message || "Failed to edit image" 
      });
    }
  });

  // 5. Veo Video Generation: Start Operation (Text-to-Video & Image-to-Video)
  app.post("/api/gemini/video-generate", async (req, res) => {
    try {
      const { 
        prompt, 
        imageBase64, 
        mimeType = "image/png", 
        aspectRatio = "16:9", 
        resolution = "720p" 
      } = req.body;

      if (!prompt && !imageBase64) {
        return res.status(400).json({ error: "Either prompt or imageBase64 is required" });
      }

      const ai = getGeminiClient();
      const validAspect = aspectRatio === "9:16" ? "9:16" : "16:9";
      const validResolution = resolution === "1080p" ? "1080p" : "720p";

      let operation;

      if (imageBase64) {
        // Image-to-Video Animation
        const rawBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
        operation = await ai.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: prompt || "Animate this cinematic film still with realistic camera motion, lifelike movement, and depth",
          image: {
            imageBytes: rawBase64,
            mimeType: mimeType
          },
          config: {
            numberOfVideos: 1,
            resolution: validResolution,
            aspectRatio: validAspect
          }
        });
      } else {
        // Text-to-Video Generation
        operation = await ai.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: `${prompt}, cinematic cinematography, 35mm film grain, dynamic lighting, professional color grade`,
          config: {
            numberOfVideos: 1,
            resolution: validResolution,
            aspectRatio: validAspect
          }
        });
      }

      res.json({
        operationName: operation.name,
        aspectRatio: validAspect,
        resolution: validResolution,
        prompt: prompt || "Image animation",
        isImageToVideo: Boolean(imageBase64),
        status: "processing",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Veo Video Start Error]:", err);
      res.status(500).json({ 
        error: err?.message || "Failed to start Veo video generation" 
      });
    }
  });

  // 6. Veo Video Status Polling
  app.post("/api/gemini/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      const ai = getGeminiClient();
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });

      const isDone = Boolean(updated.done);
      const hasError = Boolean(updated.error);
      const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;

      res.json({
        operationName,
        done: isDone,
        error: updated.error || null,
        hasVideoUri: Boolean(videoUri),
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Veo Video Status Error]:", err);
      res.status(500).json({ 
        error: err?.message || "Failed to check Veo video status" 
      });
    }
  });

  // 7. Veo Video Download Streaming
  app.post("/api/gemini/video-download", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Server GEMINI_API_KEY is not configured" });
      }

      const ai = getGeminiClient();
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

      if (!uri) {
        return res.status(404).json({ error: "Video URI not found or generation not finished yet" });
      }

      const videoRes = await fetch(uri, {
        headers: { "x-goog-api-key": apiKey }
      });

      if (!videoRes.ok || !videoRes.body) {
        return res.status(videoRes.status).json({ 
          error: `Failed to download generated video from cloud storage (${videoRes.statusText})` 
        });
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `attachment; filename="veo_production_previz_${Date.now()}.mp4"`);

      videoRes.body.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
          abort(err) {
            console.error("[Video Download Stream Aborted]:", err);
            res.end();
          }
        })
      );
    } catch (err: any) {
      console.error("[Veo Video Download Error]:", err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: err?.message || "Failed to download video file" 
        });
      }
    }
  });

  // 8. Gemini OCR Receipt & Tax Invoice Extractor Endpoint
  app.post("/api/gemini/receipt-ocr", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", availableCategories = [] } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 image data is required" });
      }

      const rawBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "").replace(/^data:application\/pdf;base64,/, "");

      const ai = getGeminiClient();

      const categoryContext = availableCategories && availableCategories.length > 0
        ? `Available project budget categories and subcategories:\n${JSON.stringify(availableCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            subCategories: c.subCategories?.map((s: any) => ({ id: s.id, name: s.name })) || []
          })), null, 2)}`
        : `Standard Indian Media & Film Production Categories: Camera, Lighting/Grip, Sound, Art & Set Construction, Costume/Wardrobe, Hair & Makeup, Transport/Vehicles, Fuel/Genset, Catering/Food, Production Office/Stationery, Locations/Studio Rent, Post Production, VFX/CGI, Equipment Hire, Crew Batta/Wages.`;

      const prompt = `You are an expert Film Production Accountant, Chartered Accountant, and Tax Auditor specialized in Indian GST, TDS withholding, and Film/OTT Production Budgeting.
Analyze the provided receipt, tax invoice, cash memo, fuel bill, restaurant receipt, or equipment rental voucher.

${categoryContext}

Extract all readable information with extreme precision and return a valid JSON object matching this schema:
{
  "vendorName": string, // Business/Store/Vendor/Payee name (e.g. "Arri India Rental Services", "Indian Oil Corp", "Film City Canteen", "Sharma Hardware")
  "invoiceNumber": string, // Invoice, Bill, Cash Memo, Receipt No, or UTR/Txn ID if present (e.g. "INV-2026-8901", "BILL-4412")
  "invoiceDate": string, // Date in format YYYY-MM-DD. If year is missing assume 2026. If date is not found return today's date.
  "gstin": string, // 15-character Indian GSTIN if present, or ""
  "pan": string, // 10-character Indian PAN number (extract from GSTIN digits 3-12 or from PAN field if visible), or ""
  "totalAmount": number, // Final gross total amount in Indian Rupees (₹) including all taxes
  "baseAmount": number, // Taxable / subtotal amount before GST/taxes
  "taxAmount": number, // Total GST/tax amount
  "gstRate": number, // Applicable GST rate percentage: 0, 5, 12, 18, or 28
  "cgstAmount": number, // Central GST if split, or 0
  "sgstAmount": number, // State GST if split, or 0
  "igstAmount": number, // Integrated GST if interstate, or 0
  "paymentMode": string, // One of: "Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque", "Petty Cash"
  "suggestedCategoryId": string, // ID of the best matching category from availableCategories (or empty string if none provided)
  "suggestedCategoryName": string, // Name of the best matching category (e.g., "Camera Equipment", "Transport & Fuel", "Catering", "Art & Set Construction")
  "suggestedSubCategoryName": string, // Specific subcategory (e.g., "Genset Fuel", "Crew Lunch", "Lens Hire", "Wood & Paint")
  "suggestedPaymentType": string, // "Purchase", "Wages", "Rent", "Reimbursement", "Professional Fee", "On Account", "Advance"
  "lineItems": [
    {
      "description": string, // Item description
      "quantity": number, // Quantity (default 1)
      "unitPrice": number, // Unit price
      "amount": number, // Total line amount
      "hsnSacCode": string // HSN or SAC code if visible (e.g. "997331", "2710")
    }
  ],
  "confidenceScore": number, // Extraction confidence score between 1 and 100
  "summary": string, // Concise 1-2 sentence production accountant note summarizing the bill
  "detectedText": string // High-level text excerpts from the invoice
}

Return ONLY raw valid JSON without markdown wrapping or code blocks if possible.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: rawBase64,
                mimeType: mimeType.startsWith("image/") ? mimeType : "image/jpeg"
              }
            },
            {
              text: prompt
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        // Cleanup potential markdown fences
        const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      // Ensure fallback sanitization
      const sanitized = {
        vendorName: parsedData.vendorName || "Unknown Vendor",
        invoiceNumber: parsedData.invoiceNumber || `BILL-${Date.now().toString().slice(-6)}`,
        invoiceDate: parsedData.invoiceDate || new Date().toISOString().split("T")[0],
        gstin: (parsedData.gstin || "").toUpperCase().trim(),
        pan: (parsedData.pan || (parsedData.gstin ? parsedData.gstin.slice(2, 12) : "")).toUpperCase().trim(),
        totalAmount: Number(parsedData.totalAmount) || 0,
        baseAmount: Number(parsedData.baseAmount) || Number(parsedData.totalAmount) || 0,
        taxAmount: Number(parsedData.taxAmount) || 0,
        gstRate: Number(parsedData.gstRate) || 0,
        cgstAmount: Number(parsedData.cgstAmount) || 0,
        sgstAmount: Number(parsedData.sgstAmount) || 0,
        igstAmount: Number(parsedData.igstAmount) || 0,
        paymentMode: parsedData.paymentMode || "Cash",
        suggestedCategoryId: parsedData.suggestedCategoryId || "",
        suggestedCategoryName: parsedData.suggestedCategoryName || "General Production",
        suggestedSubCategoryName: parsedData.suggestedSubCategoryName || "Miscellaneous",
        suggestedPaymentType: parsedData.suggestedPaymentType || "Purchase",
        lineItems: Array.isArray(parsedData.lineItems) ? parsedData.lineItems : [],
        confidenceScore: Number(parsedData.confidenceScore) || 90,
        summary: parsedData.summary || `Scanned bill for ${parsedData.vendorName || "Vendor"} amounting to ₹${parsedData.totalAmount || 0}`,
        detectedText: parsedData.detectedText || ""
      };

      res.json({
        success: true,
        data: sanitized,
        rawModel: "gemini-3.7-flash",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Receipt OCR Error]:", err);
      res.status(500).json({
        error: err?.message || "Failed to scan and extract receipt data using Gemini OCR"
      });
    }
  });

  // Google Site Verification for productionbudget.in custom domain
  app.get(["/google7f88b05eb316c4a6.html", "/google7f88b05eb316c4a6"], (_req, res) => {
    res.type("text/html").send("google-site-verification: google7f88b05eb316c4a6.html");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[PBT ERP Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
