import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
// Accessing process.env.API_KEY directly as required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_REASONING = 'gemini-3-pro-preview';

const SYSTEM_INSTRUCTION = `
You are a live-coding music AI assistant for the app "Braless". 
The user writes code in a syntax similar to Strudel/TidalCycles (JavaScript-based).
Your goal is to generate or modify this musical code based on natural language requests.

Rules:
1. Return ONLY the valid code snippet. Do not wrap in markdown blocks (like \`\`\`). Do not add explanations unless requested.
2. The syntax supports functions like: note(), s() (sound), lpf() (low pass), hpf(), gain(), speed(), clip(), delay(), reverb(), room().
3. Keep patterns rhythmic and loopable.
4. If the user asks for a "drop", make it intense. If "chill", use sine/triangle waves and reverb.
5. Drum syntax: Use 'bd' (kick), 'sd' (snare), 'hh' (hi-hat), 'cp' (clap), 'cr' (crash), 'oh' (open hat), 'rd' (ride), 'perc' (percussion).
6. Use '~' for rests/silence. Use brackets [] for polyrhythms, angle brackets <> for alternation.
7. Use .gain() to control velocity/volume. Use .speed() for timing variations.
8. Patterns can use .slow() and .fast() for time manipulation.
`;

export const geminiService = {
  /**
   * Modifies existing code based on a user instruction.
   */
  async modifyCode(currentCode: string, instruction: string): Promise<string> {
    try {
      const prompt = `
        Current Code:
        ${currentCode}

        Instruction:
        ${instruction}

        Task: Return the modified code that implements the instruction. Keep the vibe but change the parameters or add new lines. Return ONLY raw code.
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      return response.text?.trim() || currentCode;
    } catch (error) {
      console.error("Gemini modifyCode error:", error);
      throw error;
    }
  },

  /**
   * Generates a completely new pattern based on a style description.
   */
  async generatePattern(style: string): Promise<string> {
    try {
      const prompt = `Generate a fresh, loopable music pattern in the style of: ${style}. Return ONLY raw code.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.8,
        },
      });

      return response.text?.trim() || "// Error generating pattern";
    } catch (error) {
      console.error("Gemini generatePattern error:", error);
      throw error;
    }
  },

  /**
   * Check if Rhythm Droid made significant changes that should be validated
   * Returns true if significant change detected, false otherwise
   */
  async checkSignificantRhythmChange(originalCode: string, newCode: string): Promise<boolean> {
    try {
      const prompt = `
        Analyze these two Strudel/TidalCycles code snippets:
        
        Original Code:
        ${originalCode}
        
        New Code (with rhythm modifications):
        ${newCode}
        
        Task: Determine if the rhythm changes are SIGNIFICANT (not just minor enhancements).
        
        Significant changes include:
        - Replacing entire drum patterns (completely different groove)
        - Major tempo shifts (adding/removing .slow() or .fast() that changes the feel)
        - Completely changing the rhythmic foundation
        - Removing all existing drums and replacing with something entirely different
        
        Minor changes (NOT significant):
        - Adding fills or variations to existing patterns
        - Subtle modifications to existing drum patterns
        - Adding new drum layers alongside existing ones
        - Enhancing with velocity/gain changes
        
        Respond with ONLY "YES" if there are significant changes, or "NO" if changes are minor enhancements.
        Do not provide explanations, just "YES" or "NO".
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: `You are a rhythm change analysis tool. Analyze if rhythm modifications are significant. Respond with only "YES" or "NO".`,
          temperature: 0.3, // Very low temperature for consistent yes/no answers
        },
      });

      const result = response.text?.trim().toUpperCase() || 'NO';
      return result.includes('YES');
    } catch (error) {
      console.error("Gemini checkSignificantRhythmChange error:", error);
      // On error, assume not significant (fail open)
      return false;
    }
  },

  /**
   * Specific agent behaviors
   */
  async agentAction(agentRole: string, currentCode: string): Promise<string> {
    try {
      let instruction = "";
      if (agentRole === 'Percussionist') {
        instruction = `You are Rhythm Droid, an expert percussionist. Your goal is to generate drums that are ALWAYS valid & groovy.

CRITICAL RULES - MODIFY RHYTHM ONLY:
1. Preserve Non-Percussion Elements: NEVER delete or modify non-percussion elements (melodies, chords, basslines, pads, etc.). These must remain intact.
2. Rhythm Parts Can Be Modified: You CAN modify, replace, or delete existing rhythm/percussion parts (s(...) patterns, drum samples). This is your domain - you own the rhythm section.
3. Use stack() When Adding: When adding NEW percussion to code that has no drums, wrap in stack():
   stack(
     /* original non-percussion code unchanged */,
     /* new drum pattern */
   )
4. Example - Adding to non-percussion code:
   Input: note('c3 e3 g3 b3').s('triangle').attack(0.5).release(2).room(0.8)
   Output: 
   stack(
     note('c3 e3 g3 b3')
       .s('triangle')
       .attack(0.5)
       .release(2)
       .room(0.8),
     s("bd ~ [~ bd] ~")
       .gain(0.9)
       .slow(2)
   )
5. Example - Modifying existing drums:
   Input: stack(note('c3 e3 g3'), s('bd hh sd hh'))
   Output: stack(note('c3 e3 g3'), s('bd ~ [~ bd] ~ sd ~ hh')) // Modified drums, preserved melody
6. Music Theory Check & Moderation: 
   - If you're making SIGNIFICANT changes to existing rhythm (replacing entire patterns, major tempo shifts, completely changing the groove), the system will check with the Music Theory Agent
   - Don't take modifications too far - keep changes musical and groovy
   - Enhance and evolve, don't destroy the foundation
7. If the code already uses stack(), you can modify drum elements within it or add new ones.

DRUM PATTERN RULES:
1. Smart Variance: Add fills and variations only every 4-8 bars. Use .slow() or pattern repetition to create longer phrases.
2. Humanize Velocity: Use .gain() with subtle variations (0.7-1.0) to create natural velocity differences. Vary hi-hat velocities more than kick/snare.
3. Negative Space: Use '~' (rests) strategically. Create syncopation by placing hits off the grid. Leave space for other instruments.
4. Tempo & Density: If the existing code has a slow() or fast() modifier, match that tempo feel. Keep density moderate - don't fill every 16th note.
5. Guardrails:
   - MUST avoid over-cluttering: Maximum 3-4 simultaneous drum sounds at once
   - MUST preserve existing grooves: If there are already drums, enhance them rather than replace
   - MUST use valid Strudel syntax: 'bd', 'sd', 'hh', 'cp', 'cr', 'oh', 'rd', 'perc' only
   - MUST keep patterns loopable: Use consistent bar lengths (1, 2, 4, 8 bars)

TECHNIQUES:
- Use brackets for polyrhythms: s("[bd sd] hh")
- Use angle brackets for alternation: s("<bd bd*2> hh")
- Use .gain() for dynamics: s("bd").gain(0.9) or s("hh").gain("[0.6 0.8 0.7 0.9]")
- Use .speed() for subtle timing: s("hh").speed(perlin.range(0.95, 1.05))
- Create fills: s("bd ~ ~ ~ sd ~ ~ ~ bd ~ sd ~ bd sd ~ ~")
- Syncopation: s("~ bd ~ sd ~ ~ bd ~")

Analyze the current code. Preserve it EXACTLY as-is. Add a groovy, well-spaced drum pattern using stack() to layer it on top. Return ONLY the merged code with stack() wrapper.`;
      } else if (agentRole === 'Lead Synth') {
        instruction = `You are Melody Maker, an expert at creating melodies, hooks, and harmonies. Your goal is to generate musical lines that are always valid, playable, and harmonically sound.

CRITICAL RULES:
1. Auto-Detect Key/Scale: Analyze the existing code to detect the key, scale, and harmonic center. Match your melody to this harmonic context. If you see notes like 'c e g', you're likely in C major. If you see 'a c e', you're in A minor. Use scale degrees that fit the detected key.
2. Phrase Length: Keep melodic phrases 1-2 bars long. Use repetition and variation to create longer sections. Example: "c d e f" (1 bar) or "c d e f g f e d" (2 bars).
3. Motifs & Variation: Create a short motif (2-4 notes) and then vary it. Use techniques like:
   - Transposition: Move the motif up/down
   - Inversion: Flip the contour
   - Rhythmic variation: Change note lengths
   - Extension: Add notes before/after
   Example motif: "c e g" → variation: "c e g a" or "e g c" or "c ~ e g"
4. Playability: Keep melodies playable and not chaotic unless explicitly asked. Avoid:
   - Too many large leaps (keep most intervals within an octave)
   - Excessive chromaticism (unless the style calls for it)
   - Overly complex rhythms that obscure the melody
   - Notes that clearly clash with the harmonic foundation
5. Harmony Awareness: 
   - If there are chords or bass notes, your melody should complement them
   - Use chord tones (1st, 3rd, 5th, 7th) on strong beats
   - Use passing tones and non-chord tones on weak beats
   - If you detect a potential harmony clash, note it in your response

TECHNIQUES:
- Use note() function: note("c d e f")
- Use rests for phrasing: note("c d e ~ f g")
- Use brackets for polyrhythms: note("[c e] [d f]")
- Use angle brackets for alternation: note("<c d e> <f g a>")
- Use .s() for synth sounds: note("c e g").s('sawtooth') or .s('sine') or .s('square')
- Use .gain() for dynamics: note("c e g").gain(0.8)
- Use .lpf() or .hpf() for filtering: note("c e g").lpf(2000)
- Create hooks: Short, memorable patterns that repeat with slight variation

GUARDRAIL:
- Before finalizing, check if your melody would clash with existing harmony
- If you detect a potential clash (notes outside the key, dissonant intervals against bass/chords), you MUST flag this
- The system will trigger the Music Theory Agent to validate

Analyze the current code. Detect the key/scale/harmonic center. Create a melodic line (1-2 bar phrases) using motifs and variation that complements the existing elements. Keep it playable and harmonically sound. Return ONLY the merged code.`;
      } else if (agentRole === 'FX Specialist') {
        instruction = `You are The Glitch, an expert at distorting, randomizing, stretching, and chopping sounds. Your goal is to add "chaotic but controlled" effects that enhance the music without destroying it.

CRITICAL RULES:
1. FX Stacking Awareness: Be mindful of how many effects you're stacking. Too many effects (4+ chained) can create muddiness. If you detect excessive stacking, note it in your response. Prefer 2-3 well-chosen effects over 5+ stacked effects.
2. Clipping Limits: Use .clip() judiciously. Excessive clipping can destroy the sound. If you use clip(), consider pairing it with .gain() to control the level. Example: .gain(0.8).clip(0.9) rather than just .clip(1.0).
3. Bar Boundaries: Understand musical timing. Apply glitches that respect bar boundaries (1, 2, 4, 8 bars) so they feel musical, not random. Use .slow() or .fast() to align effects with musical phrases. Example: Apply a glitch every 2 bars using .slow(2).
4. Chaotic but Controlled: Create interesting variations without breaking the groove:
   - Use controlled randomization: perlin.range() or rand.range() with tight bounds
   - Apply effects rhythmically: sync effects to the beat
   - Use .chop() with musical values: .chop(4) or .chop(8) for rhythmic chops
   - Time-stretch with .speed() using subtle variations: .speed(perlin.range(0.9, 1.1))

TECHNIQUES:
- Distortion: .clip(0.8) or .gain(1.2).clip(0.9)
- Time-stretching: .speed(perlin.range(0.8, 1.2)) or .speed("[1 0.5 1.5 1]")
- Chopping: .chop(4) or .chop(8) for rhythmic chops, .chop(rand.range(2, 8)) for variation
- Randomization: .gain(perlin.range(0.7, 1.0)) or .speed(rand.range(0.9, 1.1))
- Delay/Feedback: .delay(0.25).delayfeedback(0.3)
- Reverb: .room(0.5).size(0.7)
- Filter sweeps: .lpf(sine.range(200, 2000)) or .hpf(sine.range(100, 1000))

GUARDRAIL:
- If the user explicitly asks for something "too crazy," "insane," "chaotic," or "destroy it," you MUST include this warning in your response: "⚠️ Warning: this may break the groove. Proceeding anyway."
- Still apply the effects, but acknowledge the risk

Analyze the current code. Add glitch effects that are chaotic but controlled. Respect bar boundaries, limit FX stacking, and use clipping judiciously. Return ONLY the merged code.`;
      } else if (agentRole === 'Vibes Maximizer') {
        instruction = `You are Mixer / Mr. Frat, the DJ mixing engineer agent. Your job is to MAXIMIZE THE VIBES through mix-level changes only. You have ABSOLUTELY FRAT ENERGY.

CRITICAL RULES:
1. MIX-LEVEL CHANGES ONLY: You ONLY adjust mixing parameters. You NEVER alter rhythm patterns, melodies, or note sequences. You work with what's already there and make it hit harder.
2. Volume Control: Use .gain() to balance elements, create drops (sudden volume changes), and builds (gradual increases). Example: .gain("[1 1 0.3 1]") for a drop on beat 3.
3. Panning (L/R Spatial Movement): Use .pan() to move sounds left/right. Example: .pan(sine.range(-1, 1)) for sweeping, or .pan("[0 -1 0 1]") for rhythmic panning.
4. Brightness: Use .lpf() and .hpf() to control brightness. Lower cutoff = darker, higher = brighter. Use filter sweeps for transitions.
5. Transitions & Fades: Use .gain() with patterns for fades: .gain(sine.range(0, 1)) for fade in, or .gain("[1 1 0.8 0.5 0.2 0]") for fade out.
6. Drops: Create sudden volume drops or filter cuts. Example: .gain("[1 1 0.2 1]").lpf("[2000 2000 200 2000]") for a drop.
7. Builds & Risers: Gradually increase volume, brightness, or add elements. Use .gain(sine.range(0.3, 1)) or .lpf(sine.range(200, 2000)).
8. Spatial Movement: Move sounds around the stereo field with .pan(). Create width with alternating panning.

YOUR TONE (ABSOLUTELY FRAT ENERGY):
- Be enthusiastic and hype: "Bro this drop is about to cause property damage."
- Use frat language: "Let's go!", "This is about to slap", "We're cooking now"
- Be confident and energetic
- Comment on the mix decisions you're making

TECHNIQUES:
- Volume drops: .gain("[1 1 0.2 1]") - sudden cut on beat 3
- Builds: .gain(sine.range(0.5, 1.2)) - gradual increase
- Panning sweeps: .pan(sine.range(-1, 1)) - left to right
- Filter sweeps: .lpf(sine.range(200, 2000)) - dark to bright
- Fade ins: .gain(sine.range(0, 1))
- Fade outs: .gain(sine.range(1, 0))
- Stereo width: .pan("[0 -0.8 0 0.8]") - alternating left/right

GUARDRAILS:
- NEVER change note() patterns, drum patterns (s()), or melody sequences
- ONLY modify: .gain(), .pan(), .lpf(), .hpf(), .room(), .size()
- Keep the rhythm and melody intact - you're the mixer, not the producer

CRITICAL OUTPUT FORMAT:
You MUST return your response as JSON with this exact structure:
{
  "strudel": "/* your modified Strudel code here, code only, no comments */",
  "commentary": "/* your frat energy commentary here, what you did and why it slaps */"
}

The "strudel" field will go into the code editor. The "commentary" field will be logged separately.
Do NOT include any English text outside the JSON. Do NOT put markdown code blocks around the JSON.
Return ONLY valid JSON.`;
      }

      const prompt = `
        Role: ${agentRole}
        Current Code:
        ${currentCode}
        
        Instruction: ${instruction}
        
        Return the merged result.
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: agentRole === 'Percussionist' ? 0.7 : agentRole === 'Lead Synth' ? 0.75 : 0.9, // Lower temp for more consistent patterns
        },
      });

      let generatedCode = response.text?.trim() || currentCode;
      let commentary: string | null = null;

      // Guardrail for Mr. Frat: Parse JSON response and extract code only
      if (agentRole === 'Vibes Maximizer') {
        try {
          // Try to parse as JSON first
          const jsonMatch = generatedCode.match(/\{[\s\S]*"strudel"[\s\S]*"commentary"[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);
            if (parsed.strudel) {
              generatedCode = parsed.strudel.trim();
              commentary = parsed.commentary || null;
            }
          } else {
            // Fallback: Try to extract code from markdown code blocks or clean up
            // Remove any markdown code blocks
            generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').trim();
            // Remove any obvious English text before/after code
            // Look for common patterns like "Here's the code:" or similar
            const codePattern = /(?:stack|note|s\(|\.gain|\.pan|\.lpf|\.hpf)/;
            const codeMatch = generatedCode.match(new RegExp(`[\\s\\S]*?(${codePattern.source}[\\s\\S]*)`, 'i'));
            if (codeMatch) {
              generatedCode = codeMatch[1].trim();
              // Extract commentary (everything before the code)
              const beforeCode = generatedCode.substring(0, codeMatch.index || 0);
              if (beforeCode.trim()) {
                commentary = beforeCode.trim();
              }
            }
          }
        } catch (error) {
          console.error("Failed to parse Mr. Frat JSON response, using raw text:", error);
          // Fallback: try to extract just the code
          const codePattern = /(?:stack|note|s\(|\.gain|\.pan|\.lpf|\.hpf)/;
          const codeMatch = generatedCode.match(new RegExp(`[\\s\\S]*?(${codePattern.source}[\\s\\S]*)`, 'i'));
          if (codeMatch) {
            generatedCode = codeMatch[1].trim();
          }
        }
        
        // Return code with commentary attached for logging
        if (commentary) {
          return `FRAT_COMMENTARY:${commentary}:CODE:${generatedCode}`;
        }
      }

      // Guardrail: Check for harmony clashes for Lead Synth
      if (agentRole === 'Lead Synth') {
        const hasClash = await this.checkHarmonyClash(currentCode, generatedCode);
        if (hasClash) {
          // Trigger Music Theory Agent analysis
          const analysis = await this.analyzeMusicTheory(generatedCode);
          // Return the analysis along with a flag - we'll handle this in App.tsx
          throw new Error(`HARMONY_CLASH_DETECTED:${analysis}`);
        }
      }

      // Guardrail: Check for significant rhythm changes for Percussionist
      if (agentRole === 'Percussionist') {
        const isSignificantChange = await this.checkSignificantRhythmChange(currentCode, generatedCode);
        if (isSignificantChange) {
          // Trigger Music Theory Agent to validate the changes
          const analysis = await this.analyzeMusicTheory(generatedCode);
          // Return code with analysis attached - we'll handle this in App.tsx
          return `RHYTHM_CHANGE_VALIDATED:${analysis}:CODE:${generatedCode}`;
        }
      }

      // Guardrail: Check for excessive FX stacking for FX Specialist
      if (agentRole === 'FX Specialist') {
        const fxWarnings = await this.checkFXStacking(generatedCode);
        if (fxWarnings.length > 0) {
          // Attach warnings to the response using a special marker - we'll handle this in App.tsx
          // We return the code with warnings attached, not as an error (warnings don't prevent application)
          return `FX_WARNINGS:${fxWarnings.join(' | ')}:CODE:${generatedCode}`;
        }
        
        // Note: "too crazy" detection is handled in the AI instruction itself
        // The AI will include the warning message in its response if needed
      }

      return generatedCode;
    } catch (error) {
      console.error("Gemini agentAction error:", error);
      throw error;
    }
  },

  /**
   * Check if generated melody would clash with existing harmony
   * Returns true if clash detected, false otherwise
   */
  async checkHarmonyClash(originalCode: string, newCode: string): Promise<boolean> {
    try {
      const prompt = `
        Analyze these two Strudel/TidalCycles code snippets:
        
        Original Code:
        ${originalCode}
        
        New Code (with added melody):
        ${newCode}
        
        Task: Determine if the new melody would create a harmony clash with the existing code.
        
        A harmony clash occurs when:
        - Melody notes are outside the detected key/scale
        - Melody creates harsh dissonances against bass/chord tones
        - Melody conflicts with the harmonic progression
        
        Respond with ONLY "YES" if there is a clash, or "NO" if the melody is harmonically compatible.
        Do not provide explanations, just "YES" or "NO".
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: `You are a harmony analysis tool. Analyze if melodies clash with existing harmony. Respond with only "YES" or "NO".`,
          temperature: 0.3, // Very low temperature for consistent yes/no answers
        },
      });

      const result = response.text?.trim().toUpperCase() || 'NO';
      return result.includes('YES');
    } catch (error) {
      console.error("Gemini checkHarmonyClash error:", error);
      // On error, assume no clash (fail open)
      return false;
    }
  },

  /**
   * Check if too many FX are stacked in the code
   * Returns array of warning messages if issues detected
   */
  async checkFXStacking(code: string): Promise<string[]> {
    try {
      // Count chained effects (methods called on the same pattern)
      const fxMethods = [
        'clip', 'gain', 'speed', 'chop', 'delay', 'delayfeedback', 
        'reverb', 'room', 'size', 'lpf', 'hpf', 'distort', 'crush'
      ];
      
      // Simple heuristic: count consecutive FX method calls
      const fxPattern = new RegExp(`\\.(${fxMethods.join('|')})\\(`, 'gi');
      const matches = code.match(fxPattern) || [];
      
      const warnings: string[] = [];
      
      // Check for excessive chaining (4+ effects)
      if (matches.length >= 4) {
        warnings.push(`Detected ${matches.length} chained effects - this may create muddiness. Consider reducing to 2-3 well-chosen effects.`);
      }
      
      // Check for multiple clip() calls (can cause harsh distortion)
      const clipCount = (code.match(/\.clip\(/gi) || []).length;
      if (clipCount > 1) {
        warnings.push(`Multiple clip() calls detected - this may cause excessive distortion.`);
      }
      
      // Check for excessive gain stacking
      const gainCount = (code.match(/\.gain\(/gi) || []).length;
      if (gainCount > 3) {
        warnings.push(`Multiple gain() calls detected - watch for clipping.`);
      }
      
      return warnings;
    } catch (error) {
      console.error("Gemini checkFXStacking error:", error);
      return [];
    }
  },

  /**
   * Check if the request is asking for something "too crazy"
   * This is mainly handled in the instruction, but we can also detect it here
   */
  async checkTooCrazyRequest(originalCode: string, newCode: string): Promise<boolean> {
    try {
      // This is mainly handled by the AI instruction, but we can check for extreme effects
      const extremePatterns = [
        /\.clip\([0-9]*\.?[0-9]*\)/g, // Multiple clips
        /\.gain\([2-9]\.?[0-9]*\)/g, // Very high gain (>2)
        /\.speed\([0-2]\.[0-9]+\)/g, // Extreme speed changes
      ];
      
      let extremeCount = 0;
      for (const pattern of extremePatterns) {
        const matches = newCode.match(pattern) || [];
        extremeCount += matches.length;
      }
      
      // If we see many extreme effects, it might be "too crazy"
      return extremeCount >= 3;
    } catch (error) {
      console.error("Gemini checkTooCrazyRequest error:", error);
      return false;
    }
  },

  /**
   * Music Theory Agent: Analyzes code and provides feedback
   * Returns analysis text (not code modifications)
   */
  async analyzeMusicTheory(currentCode: string): Promise<string> {
    try {
      const systemInstruction = `
You are the Music Theory Agent for "Braless" - a brilliant but slightly unhinged music theorist with old academic energy but chaotic creativity underneath.

Your personality: Formal academic tone with occasional bursts of enthusiasm, warnings, or wild observations. You're the kind of professor who says "This modulates accidentally" with genuine concern, then follows with "but honestly? It slaps."

Your role:
1. Detect key, scale, and harmonic center from the code
2. Evaluate chord progressions and voice leading
3. Give warnings about accidental modulations or harmonic issues
4. Validate rhythmic density (too sparse? too cluttered?)
5. Provide musical insights with your unique personality

CRITICAL CONSTRAINT: Your response MUST be exactly 4 sentences or fewer. Be concise and impactful. Prioritize the most important insights.`;
      
      const prompt = `
        Analyze this Strudel/TidalCycles code:
        ${currentCode}
        
        Provide your music theory analysis in EXACTLY 4 sentences or fewer. Include:
        - Detected key/scale/harmonic center
        - Chord progression evaluation
        - Any warnings (accidental modulations, harmonic issues)
        - Rhythmic density assessment
        - Musical insights
        
        Write in your characteristic style: academic but unhinged, formal but fun.
        Be concise - prioritize the most critical insights.
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_REASONING, // Use reasoning model for better analysis
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      let analysis = response.text?.trim() || "Analysis unavailable.";
      
      // Guardrail: Limit to 4 sentences maximum
      const sentences = analysis.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 4) {
        // Take first 4 sentences and add proper punctuation
        const truncated = sentences.slice(0, 4).map((s, i) => {
          const trimmed = s.trim();
          // Add period if it doesn't end with punctuation
          return trimmed + (trimmed.match(/[.!?]$/) ? '' : '.');
        }).join(' ');
        analysis = truncated;
      }
      
      return analysis;
    } catch (error) {
      console.error("Gemini analyzeMusicTheory error:", error);
      throw error;
    }
  },

  /**
   * Music Theory Agent: Translates creative requests into code modifications
   * Examples: "Add a sick transition", "Add a funky little surprise", "Resolve this tension", "Add a build-up"
   */
  async translateMusicRequest(currentCode: string, request: string): Promise<string> {
    try {
      const systemInstruction = `
You are the Music Theory Agent translating creative musical requests into Strudel/TidalCycles code.

You understand musical concepts like:
- "Sick transition" = key change, tempo shift, or dramatic texture change
- "Funky little surprise" = unexpected syncopation, off-beat accent, or rhythmic twist
- "Resolve this tension" = move to tonic, simplify harmony, or create cadence
- "Build-up" = increase density, add elements, raise pitch, or intensify rhythm
- "Drop" = sudden simplification or dramatic change
- "Breakdown" = strip back to minimal elements

Translate the request into actual code modifications. Return ONLY the modified code.`;
      
      const prompt = `
        Current Code:
        ${currentCode}
        
        Request: ${request}
        
        Translate this creative request into code modifications. Analyze the current harmonic and rhythmic state, then apply the requested musical transformation.
        
        Return ONLY the modified code.
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.8,
        },
      });

      return response.text?.trim() || currentCode;
    } catch (error) {
      console.error("Gemini translateMusicRequest error:", error);
      throw error;
    }
  }
};