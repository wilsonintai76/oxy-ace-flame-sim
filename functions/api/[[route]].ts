import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/cloudflare-pages';

// ── Types ────────────────────────────────────────────────────────────────────

type Bindings = {
  AI: Ai; // Cloudflare Workers AI binding (declared in wrangler.toml)
};

interface TorchState {
  lit: boolean;
  oxyCylinderOpen: boolean;
  aceCylinderOpen: boolean;
  oxyRegulatorPSI: number;
  aceRegulatorPSI: number;
  oxyTorchValve: number;
  aceTorchValve: number;
  o2Flow: number;
  c2h2Flow: number;
  ratio: number;
  flameType: string;
}

interface MetallurgicalState {
  distanceToWorkpiece: number;
  puddleTemperature: number;
  puddleState: string;
  sootLevel: number;
  oxideLevel: number;
}

interface WeldSummary {
  duration: number;
  maxTemp: number;
  avgDistance: number;
  flameCounts: Record<string, number>;
  peakSoot: number;
  peakOxide: number;
  puddleStates: string[];
  grade: string;
  score: number;
  dominantFlame: string;
}

interface ChatRequestBody {
  torchState?: TorchState;
  metallurgicalState?: MetallurgicalState;
  queryType?: string;
  weldSummary?: WeldSummary | null;
  message?: string;
  history?: Array<{ role: string; content: string }>;
}

// ── Hono App ─────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes (needed during Pages dev proxy)
app.use('*', cors());

// POST /api/chat
// Accepts torch/metallurgical state + query type, calls Llama 3.3 70B via Workers AI,
// returns a professional metallurgical analysis report as { text: string }.
app.post('/api/chat', async (c) => {
  let body: ChatRequestBody;

  try {
    body = await c.req.json<ChatRequestBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { torchState, metallurgicalState, queryType, weldSummary, message, history } = body;

  let systemPrompt = '';
  let userPrompt = '';

  // ── Branch 1: Post-weld session summary audit ─────────────────────────────
  if (weldSummary) {
    const { duration, maxTemp, avgDistance, flameCounts, peakSoot, peakOxide, puddleStates, grade, score, dominantFlame } = weldSummary;

    systemPrompt =
      'You are an elite Metallurgical and Gas Dynamics Consultant assisting a student in an Oxy-Acetylene Flame Simulator. Your goal is to provide a highly academic, professional, and practical evaluation of the completed welding run session. Be extremely concise, structured, and use standard metallurgical terms. Keep markdown clean.';

    if (queryType === 'equations') {
      userPrompt = `Please generate a highly educational chemical breakdown of the reaction equations for the dominant flame environment used in this run:
- Dominant Flame Class: ${dominantFlame.toUpperCase()}
- Run Duration: ${duration} seconds

Describe the specific combustion steps and chemical formulas:
1. **Primary Combustion Reaction**: (e.g. C2H2 + O2 -> 2CO + H2 + Heat) and how the inner cone forms.
2. **Secondary Combustion Envelope**: (e.g. 2CO + H2 + 1.5O2 -> 2CO2 + H2O + Heat) showing how ambient air is consumed.
3. **Active Gas Species Interactions**: How the chemistry of the flame (${dominantFlame}) affected the iron matrix (Fe) during the run with peak contaminants (Soot: ${peakSoot}%, Oxide: ${peakOxide}%).`;
    } else if (queryType === 'carbon_steel') {
      userPrompt = `Analyze the metallurgical effects on Carbon Steels based on the physical history of this completed weld session:
- Run Duration: ${duration} seconds
- Peak Temperature: ${maxTemp}°C (Puddle states reached: ${puddleStates.join(' ⟶ ')})
- Average Torch Distance: ${avgDistance} mm
- Dominant Flame: ${dominantFlame} (Neutral: ${flameCounts['Neutral (Ideal)'] || 0}s, Oxidizing: ${flameCounts['Oxidizing'] || 0}s, Carburizing: ${flameCounts['Carburizing'] || 0}s, Pure Acetylene: ${flameCounts['Pure Acetylene'] || 0}s)

Evaluate:
1. **HAZ & Microstructure Impact**: At a peak temp of ${maxTemp}°C, how did the heating duration and rate affect grain growth, coarsening, or martensite hardening?
2. **Carbon Diffusion Dynamics**: Given the dominant ${dominantFlame} environment, analyze the carburization or decarburization risks in low-to-high carbon steels.
3. **Porosity & Defect Risk**: Critically assess the likelihood of weld pool oxidation, hydrogen gas trapping, or slag entrapment under these conditions.`;
    } else if (queryType === 'stainless') {
      userPrompt = `Analyze the metallurgical effects on Austenitic Stainless Steels (e.g. 304) based on the physical history of this completed weld session:
- Run Duration: ${duration} seconds
- Peak Temperature: ${maxTemp}°C
- Dominant Flame: ${dominantFlame} (Neutral: ${flameCounts['Neutral (Ideal)'] || 0}s, Oxidizing: ${flameCounts['Oxidizing'] || 0}s, Carburizing: ${flameCounts['Carburizing'] || 0}s, Pure Acetylene: ${flameCounts['Pure Acetylene'] || 0}s)

Critique:
1. **Chromium Carbide Precipitation (Sensitization)**: Explain how exposure to high temperatures (${maxTemp}°C) in this gas atmosphere triggers carbon binding with Chromium (Cr23C6) at the grain boundaries.
2. **Loss of Passive Oxide Layer**: How the peak oxide scaling (${peakOxide}%) and soot deposition (${peakSoot}%) alter the material's corrosion resistance.
3. **Prevention & Stainless Parameters**: Specify the exact steps and adjustments needed to safely weld stainless steel using gas fusion without sensitizing the alloy.`;
    } else if (queryType === 'troubleshooting') {
      userPrompt = `The student completed a ${duration}s weld run with a quality score of ${score}/100 (Grade ${grade}).
- Dominant Flame: ${dominantFlame}
- Average Distance: ${avgDistance} mm (Target: 6.0 mm)
- Peak Soot: ${peakSoot}%
- Peak Oxide: ${peakOxide}%
- Thermal Profile: reached ${maxTemp}°C (States: ${puddleStates.join(' ⟶ ')})

Provide 3 highly actionable, expert welder corrective actions to:
1. Improve manual torch manipulation to maintain consistent distance and angle.
2. Dial in the regulatory and torch valves to achieve and hold a steady Neutral Flame.
3. Keep the weld pool clean and free of excessive soot/oxide contamination.`;
    } else {
      // Full Audit (default)
      userPrompt = `Here is the comprehensive telemetry from the completed weld session:
- **Total Fusion Duration**: ${duration} seconds
- **Peak Weld Pool Temperature**: ${maxTemp}°C
- **Average Torch-to-Workpiece Distance**: ${avgDistance} mm (Target: 6.0 mm)
- **Active States Visited**: ${puddleStates.join(' ⟶ ')}
- **Peak Oxide Scaling**: ${peakOxide}% | **Peak Soot Buildup**: ${peakSoot}%
- **Flame Atmosphere Log**:
  * Neutral (Ideal): ${flameCounts['Neutral (Ideal)'] || 0} seconds
  * Oxidizing (Oxidative): ${flameCounts['Oxidizing'] || 0} seconds
  * Carburizing (Reducing): ${flameCounts['Carburizing'] || 0} seconds
  * Pure Acetylene (Sooty): ${flameCounts['Pure Acetylene'] || 0} seconds
- **Session Overall Grade**: ${grade} (Score: ${score}/100)

Please compile a highly academic, beautifully structured **Oxy-Acetylene Post-Weld Process Analysis** divided into 3 distinct parts:
1. 🔬 **Thermal Profile & Joint Metallurgy Critique**: Evaluate the temperature history of ${maxTemp}°C. Analyze if they successfully melted the workpiece, the transition across liquidus/solidus boundaries, and joint penetration.
2. 🎛️ **Flame Atmosphere & Chemistry Evaluation**: Analyze their ability to maintain a Neutral Flame. Critique the dominant ${dominantFlame} environment and its carbon/oxygen chemical reactivity with the molten iron matrix.
3. ⚠️ **Defect Prediction & Master Welder Advice**: Predict key metallurgical flaws (such as grain coarsening in the HAZ, carbon contamination, or oxide inclusions). Provide 2 specific practical tips to elevate their hand coordination and setting execution.`;
    }

  // ── Branch 2: Live torch state audit ────────────────────────────────────
  } else if (torchState && metallurgicalState) {
    const { lit, oxyTorchValve, aceTorchValve, oxyRegulatorPSI, aceRegulatorPSI, o2Flow, c2h2Flow, ratio, flameType } = torchState;
    const { distanceToWorkpiece, puddleTemperature, puddleState, sootLevel, oxideLevel } = metallurgicalState;

    systemPrompt =
      'You are an elite Metallurgical and Gas Dynamics Consultant assisting a student in an Oxy-Acetylene Flame Simulator. Your goal is to provide a highly academic, professional, and practical evaluation of the current torch and weld puddle settings. Be extremely concise, structured, and use standard metallurgical terms. Keep markdown clean.';

    if (queryType === 'full_audit') {
      userPrompt = `State of Torch and Workpiece:
- Torch status: ${lit ? 'LIT & IGNITED' : 'NOT IGNITED (GAS MIX ONLY)'}
- Valve Openings: Oxygen = ${oxyTorchValve}%, Acetylene = ${aceTorchValve}%
- Gas Flow Rates: O2 = ${o2Flow.toFixed(2)}, Acetylene = ${c2h2Flow.toFixed(2)}
- O2 / (O2+Acetylene) Ratio: ${ratio.toFixed(2)} (Flame Classification: ${flameType.toUpperCase()})
- Regulator Pressures: O2 = ${oxyRegulatorPSI} psi, Acetylene = ${aceRegulatorPSI} psi
- Torch-to-Workpiece Distance: ${distanceToWorkpiece.toFixed(1)} mm
- Weld Puddle Temperature: ${puddleTemperature}°C (${puddleState.toUpperCase()} phase)
- Workpiece Contamination: Soot = ${sootLevel.toFixed(1)}%, Oxide Scaling = ${oxideLevel.toFixed(1)}%

Please provide a structured, beautiful, and deeply academic **Metallurgical Audit Report** in exactly 3 sections:
1. 🔬 **Combustion Dynamics & Zone Chemistry**: Grade the current ratio and explain the chemical reactions taking place (or gas dispersion if unlit). Mention dissociation temperatures and the chemistry of the flame zones.
2. 🎛️ **Weld Puddle & Thermal Analysis**: Evaluate the thermal impact on the joint at ${puddleTemperature}°C. Analyze the soot and oxide buildup.
3. ⚠️ **Defect Prediction & Mitigation**: Give an overall safety/quality grade (A to F) for welding steel under these conditions. State key risks (e.g. carburization, hydrogen embrittlement, oxidation, severe scaling) and 2 specific adjustments to reach the perfect neutral state.`;
    } else if (queryType === 'equations') {
      userPrompt = `Please generate a highly educational breakdown of the chemical reaction equations for this specific flame setting:
- Flame Class: ${flameType.toUpperCase()} (Gas ratio: ${ratio.toFixed(2)})
- Flow rates: O2 = ${o2Flow.toFixed(2)}, C2H2 = ${c2h2Flow.toFixed(2)}

Describe the specific combustion steps:
1. **Primary Combustion Reaction**: (e.g. C2H2 + O2 -> 2CO + H2 + Heat) and how the inner cone forms.
2. **Secondary Combustion Envelope**: (e.g. 2CO + H2 + 1.5O2 -> 2CO2 + H2O + Heat) showing how ambient air is consumed.
3. **Metallurgical Chemistry**: How the excess gas species (free carbon or free oxygen) interact with the iron matrix (Fe) in the molten weld pool. Use chemical formulas where appropriate.`;
    } else if (queryType === 'carbon_steel') {
      userPrompt = `Analyze the metallurgical effects of welding low-carbon and high-carbon steels using these current settings:
- Flame setting: ${flameType.toUpperCase()}
- Joint Temperature: ${puddleTemperature}°C (Phase: ${puddleState})
- Workpiece Distance: ${distanceToWorkpiece} mm

Explain:
1. **Carburizing/Decarburizing Risk**: Will carbon diffuse into or burn out of the steel matrix?
2. **Heat Affected Zone (HAZ)**: How does the heating speed and temperature profile affect grain growth and hardness (e.g. formation of martensite or grain coarsening)?
3. **Weld Pool Fluidity**: How do the soot/oxide states affect slag viscosity and surface tension?`;
    } else if (queryType === 'stainless') {
      userPrompt = `Explain why using this current setting (${flameType.toUpperCase()}, gas ratio ${ratio.toFixed(2)}) affects Austenitic Stainless Steels (e.g., 304).

Focus heavily on:
1. **Chromium Carbide Precipitation (Sensitization)**: Explain how free carbon at these temperatures reacts with chromium, forming Cr23C6 along grain boundaries.
2. **Corrosion Resistance Loss**: Detail the resulting "chromium-depleted zones" and subsequent intergranular corrosion.
3. **Ideal Setup**: Provide the exact flame adjustment needed to safely fuse stainless steel without destroying its alloy properties.`;
    } else if (queryType === 'troubleshooting') {
      userPrompt = `The student is experiencing high defect levels: Soot = ${sootLevel.toFixed(1)}%, Oxide = ${oxideLevel.toFixed(1)}%, current puddle phase: ${puddleState}.
Torch is ${lit ? 'LIT' : 'NOT LIT'}. Flame type: ${flameType.toUpperCase()}.

Provide 3 highly practical, numbered steps (a real Master Welder's checklist) to:
1. Eradicate soot and oxide buildup on the workpiece.
2. Achieve the perfect neutral flame setup.
3. Stabilize the weld puddle for a clean, consistent bead. Keep it brief and extremely actionable.`;
    }

  // ── Branch 3: Simple chat fallback ──────────────────────────────────────
  } else {
    systemPrompt =
      'You are a Master Welder and Metallurgical Engineer. Answer welding questions concisely. If unrelated to welding, politely redirect the student.';
    userPrompt = message || 'Analyze';
  }

  // ── Call Workers AI ──────────────────────────────────────────────────────
  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add chat history for simple chat fallback
    if (!torchState && !metallurgicalState && !weldSummary && history && history.length > 0) {
      for (const h of history) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role as 'user' | 'assistant', content: h.content });
        }
      }
    }

    const aiResult = await c.env.AI.run(
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast' as any,
      {
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: userPrompt },
        ],
      }
    );

    const text = ((aiResult as unknown) as { response: string }).response;

    return c.json({
      text: text || 'Analysis complete. Please review the computed metallurgical metrics.',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Workers AI Error:', errorMessage);
    return c.json(
      { error: 'Failed to compile metallurgical diagnostics report.', detail: errorMessage },
      500
    );
  }
});

// ── Export for Cloudflare Pages Functions ────────────────────────────────────
// The `handle` adapter converts Hono's app into a Pages Functions handler.
// Cloudflare Pages Functions will pick this up from /functions/api/[[route]].ts
export const onRequest = handle(app);

// Export the app type for Hono RPC client usage in the frontend
export type AppType = typeof app;
