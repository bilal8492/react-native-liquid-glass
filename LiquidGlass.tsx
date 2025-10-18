import React, { useMemo } from 'react';
import {
    Canvas,
    BackdropFilter,
    ImageFilter,
    Skia,
    TileMode,
    BlendMode,
    vec,
    processTransform2d,
    processUniforms,
    ColorChannel
} from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { Pattern } from './Pattern';

// ============================================================================
// TYPES & HELPERS
// ============================================================================

type Value = string | number;
type Values = Value[];

/**
 * Helper function to interpolate template strings with values
 * Used for creating GLSL shader code with dynamic values
 */
const glsl = (source: TemplateStringsArray, ...values: Values) => {
    const processed = source
        .flatMap((s, i) => [s, values[i] ?? ''])
        .filter(v => v !== undefined && v !== null);
    return processed.join("");
};

/**
 * Compiles GLSL fragment shader code into a Skia RuntimeEffect
 * @throws Error if shader compilation fails
 */
const frag = (source: TemplateStringsArray, ...values: Values) => {
    const code = glsl(source, ...values);
    const rt = Skia.RuntimeEffect.Make(code);
    if (rt === null) {
        throw new Error("Couldn't compile shader");
    }
    return rt;
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface LiquidGlassProps {
    width: number;   // Width of the glass component
    height: number;  // Height of the glass component
    x?: number;      // X position (default: 0)
    y?: number;      // Y position (default: 0)
    radius?: number; // Corner radius for rounded rectangle (default: 0)
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LiquidGlass Component
 * 
 * A customizable glass morphism effect component with animated border segments.
 * Uses React Native Skia for high-performance rendering and GLSL shaders for 
 * custom visual effects.
 * 
 * Features:
 * - Dual-layer rendering: main glass effect + separate border effect
 * - GLSL-based signed distance functions for precise shape rendering
 * - Animated border segments with smooth fade transitions
 * - Light refraction simulation with displacement mapping
 * - Configurable positioning and dimensions
 * 
 * Technical Details:
 * - Border grows inward (d < 0) to maintain component bounds
 * - Border segments at 50% visibility: 25% top-left + 25% bottom-right
 * - Glass blur: sigma = 8px for prominent glass effect
 * - Border blur: sigma = 0px for crisp edges
 * - Angle-based segment control using polar coordinates (t)
 * 
 * Customization:
 * - Adjust borderThickness in shader (line ~120) to change border width
 * - Modify fade ranges in smoothstep calls (lines ~150-170) to control segment transitions
 * - Change blur sigma values (glass: line ~285, border: line ~330) for blur intensity
 * - Update segment angles (t values, lines ~140-145) to reposition border segments
 */
export const LiquidGlass: React.FC<LiquidGlassProps> = ({
    width,
    height,
    x = 0,
    y = 0,
    radius = 0
}) => {
    const RADIUS = radius;

    // Shared uniforms used by both shaders
    const baseUniforms = glsl`
        uniform float progress;  // Animation progress (unused currently)
        uniform vec2 c1;         // Control point (unused currently)
        uniform vec4 box;        // Box dimensions [left, top, right, bottom]
        uniform float r;         // Radius for rounded corners
        uniform vec2 position;   // Center position of the glass
    `;

    // ========================================================================
    // BORDER SHADER - Renders the glassy border effect
    // ========================================================================
    const borderSource = frag`
${baseUniforms}

/**
 * Signed Distance Function for a rounded box
 * Returns: vec2(distance, angle)
 * - distance: negative inside, zero at edge, positive outside
 * - angle: normalized 0-1 around perimeter (0=right, 0.25=top, 0.5=left, 0.75=bottom)
 */
vec2 sdRoundedBox(vec2 p, vec2 b, vec4 radius) {
  radius.xy = (p.x > 0.0) ? radius.xy : radius.zw;
  radius.x = (p.y > 0.0) ? radius.x : radius.y;
  vec2 q = abs(p) - b + radius.x;
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius.x;
  
  float angle = atan(p.y, p.x);
  float t = angle / (2.0 * 3.14159265);
  if (t < 0.0) t += 1.0;

  return vec2(d, t);
}

half4 main(float2 p) {
  vec2 boxCenter = position;
  vec2 size = vec2(box.z, box.w);
  vec2 pos = p - boxCenter;

  vec2 sdf = sdRoundedBox(pos, size, vec4(${RADIUS}.0));
  float d = sdf.x;  // Distance from edge
  float t = sdf.y;  // Angle around perimeter (0-1)

  // ============ BORDER CONFIGURATION ============
  float borderThickness = 3.0;  // Width of the border in pixels
  
  // Check if we're in the inner border region
  if (d < -borderThickness) return vec4(0.0);  // Too far inside - no border
  
  // Only render the border INSIDE the shape (d < 0)
  if (d < 0.0) {
    // Create smooth edge transitions for the border
    float borderMask = smoothstep(-borderThickness, -borderThickness + 2.0, d) * 
                       smoothstep(1.0, -1.0, d);
    
    float segmentMask = 0.0;

    // ============ TOP-LEFT SEGMENT (wraps around t=0) ============
    // Covers: bottom-left corner -> top edge -> top-right corner
    if (t >= 0.975 || t <= 0.465) {
      float fadeIn = 0.0;
      float fadeOut = 0.0;
      
      if (t >= 0.975) {
        // Approaching wrap point from left side
        fadeIn = smoothstep(0.975, 0.999, t);
        fadeOut = 1.0;
        segmentMask = fadeIn * fadeOut;
      } else if (t <= 0.465) {
        // After wrap point, fading out on right side
        fadeIn = 1.0;
        fadeOut = smoothstep(0.465, 0.420, t);
        segmentMask = fadeIn * fadeOut;
      }
    }
    
    // ============ BOTTOM-RIGHT SEGMENT ============
    // Covers: right-bottom corner -> bottom edge -> left-bottom corner
    if (t >= 0.490 && t <= 0.585) {
      float fadeIn = smoothstep(0.490, 0.525, t);   // Fade in from left
      float fadeOut = smoothstep(0.585, 0.550, t);  // Fade out at right
      segmentMask = max(segmentMask, fadeIn * fadeOut);
    }
    
    // Hide if not in any visible segment
    if (segmentMask < 0.01) return vec4(0.0);
    
    // Pure white border color
    vec3 whiteColor = vec3(1.0, 1.0, 1.0);
    
    // Combine all masks for final border opacity
    float finalAlpha = borderMask * segmentMask * 0.9;
    
    return vec4(whiteColor, finalAlpha);
  }
  
  // Outside the border region
  return vec4(0.0);
}
`;

    // ========================================================================
    // GLASS SHADER - Renders the main glass effect with colorful pattern
    // ========================================================================
    const glassSource = frag`
${baseUniforms}

vec2 sdRoundedBox(vec2 p, vec2 b, vec4 radius) {
  radius.xy = (p.x > 0.0) ? radius.xy : radius.zw;
  radius.x = (p.y > 0.0) ? radius.x : radius.y;
  vec2 q = abs(p) - b + radius.x;
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius.x;
  
  float t = atan(p.y, p.x) / (2.0 * 3.14159265) + 0.59;

  return vec2(d, t);
}

half4 main(float2 p) {
  vec2 boxCenter = position;
  vec2 size = vec2(box.z, box.w);
  vec2 pos = p - boxCenter;

  vec2 sdf = sdRoundedBox(pos, size, vec4(${RADIUS}.0));
  float d = sdf.x;
  float t = sdf.y;

  // Create animated color pattern
  float patternFreq = 3.0;
  float centerFactor = clamp(-d / r, 1.0, 1.0);
  float edgePattern = sin(t * 2.0 * 3.14159265 * patternFreq) * 0.5 + 0.5;

  // Define colors
  vec3 yellow = vec3(0.9, 0.8, 0.0);
  vec3 red = vec3(0.9, 0.2, 0.2);
  vec3 green = vec3(0.2, 0.8, 0.2);
  vec3 edgeColor = mix(red, green, edgePattern);

  // Mix from edge color to center color
  vec3 color = mix(edgeColor, yellow, centerFactor);
  
  // Smooth anti-aliasing for rounded corners
  // Smoothstep provides 2-pixel transition at edges
  float alpha = 1.0 - smoothstep(-2.0, 0.5, d);
  
  return vec4(color, alpha);
}
`;

    // Box dimensions: center position and half-widths
    const box = useMemo(() => [width / 2, height / 2, width / 2, height / 2], [width, height]);

    // ========================================================================
    // UNIFORMS - Shared parameters passed to both shaders
    // ========================================================================
    // Completely static uniforms - no animation system
    const uniforms = useMemo(() => {
        return {
            progress: 0,
            c1: vec(0, 0),
            box: box,
            r: RADIUS,
            position: [x + width / 2, y + height / 2]
        };
    }, [box, RADIUS, x, y, width, height]);

    // ========================================================================
    // GLASS FILTER - Creates main glass morphism blur effect
    // ========================================================================
    // Filter chain: blur (sigma=10) → displacement → white tint → backdrop blend
    // CRITICAL: Using useMemo (not useDerivedValue) to prevent filter recreation
    const sigma = 10; // Blur intensity
    
    // Cache the shader separately to minimize recreations
    const glassShaderInstance = useMemo(() => {
        const localMatrix = processTransform2d([]);
        return glassSource.makeShader(
            processUniforms(glassSource, uniforms),
            localMatrix
        );
    }, [uniforms]); // Remove glassSource from deps - it's stable
    
    const glassFilter = useMemo(() => {
        const shaderFilter = Skia.ImageFilter.MakeShader(glassShaderInstance);
        const blendFilter = Skia.ImageFilter.MakeBlend(BlendMode.SrcIn, shaderFilter);

        const whiteTint = Skia.ImageFilter.MakeShader(
            Skia.Shader.MakeColor(Skia.Color("rgba(94, 94, 94, 0.78)"))
        );

        const displacementMap = Skia.ImageFilter.MakeDisplacementMap(
            ColorChannel.R,
            ColorChannel.G,
            40,
            shaderFilter
        );

        return Skia.ImageFilter.MakeCompose(
            blendFilter,
            Skia.ImageFilter.MakeBlur(
                sigma,
                sigma,
                TileMode.Decal,
                Skia.ImageFilter.MakeBlend(
                    BlendMode.SrcOver,
                    displacementMap,
                    whiteTint
                )
            )
        );
    }, [glassShaderInstance, sigma]); // Only recreate when shader changes

    // ========================================================================
    // BORDER FILTER - Creates light-refractive glassy border segments
    // ========================================================================
    // Filter chain: no blur (sigma=0) → displacement → gradient → glass tint
    
    // Cache the shader separately
    const borderShaderInstance = useMemo(() => {
        const localMatrix = processTransform2d([]);
        return borderSource.makeShader(
            processUniforms(borderSource, uniforms),
            localMatrix
        );
    }, [uniforms]); // Add uniforms dependency
    
    const borderFilter = useMemo(() => {
        const shaderFilter = Skia.ImageFilter.MakeShader(borderShaderInstance);
        const sigma = 0;

        const blendFilter = Skia.ImageFilter.MakeBlend(BlendMode.SrcIn, shaderFilter);

        const glassTint = Skia.ImageFilter.MakeShader(
            Skia.Shader.MakeColor(Skia.Color("rgba(251, 251, 251, 0.97)"))
        );

        const lightGradient = Skia.Shader.MakeLinearGradient(
            vec(0, 0),
            vec(width, height),
            [
                Skia.Color("rgba(255, 255, 255, 1)"),
                Skia.Color("rgba(255, 255, 255, 0.4)"),
                Skia.Color("rgba(255, 255, 255, 0.2)"),
                Skia.Color("rgba(255, 255, 255, 0.1)"),
                Skia.Color("rgba(255, 255, 255, 0.05)")
            ],
            null,
            TileMode.Clamp
        );

        const gradientFilter = Skia.ImageFilter.MakeShader(lightGradient);

        const displacementMap = Skia.ImageFilter.MakeDisplacementMap(
            ColorChannel.R,
            ColorChannel.G,
            15,
            shaderFilter
        );

        return Skia.ImageFilter.MakeCompose(
            blendFilter,
            Skia.ImageFilter.MakeBlur(
                sigma,
                sigma,
                TileMode.Clamp,
                Skia.ImageFilter.MakeBlend(
                    BlendMode.SrcOver,
                    displacementMap,
                    Skia.ImageFilter.MakeBlend(
                        BlendMode.Screen,
                        glassTint,
                        gradientFilter
                    )
                )
            )
        );
    }, [borderShaderInstance, width, height]);

    // ========================================================================
    // RENDER - Layered BackdropFilters create glass morphism effect
    // ========================================================================
    // Layer 1: Pattern background
    // Layer 2: Glass effect with heavy blur (8px) - renders first (underneath)
    // Layer 3: Border effect with no blur - renders second (on top)
    //
    // Clip regions:
    // - Glass: exact component bounds (x, y, width, height)
    // - Border: extended bounds (±15px padding) to accommodate inward-growing border
    return (
        <Canvas style={{ ...StyleSheet.absoluteFill }}>
            {/* Background pattern - TEMPORARILY REMOVED to test flickering */}
            <Pattern />

            {/* Main glass effect with blur - rendered underneath */}
            <BackdropFilter
                clip={{ x, y, width, height }}
                filter={<ImageFilter filter={glassFilter} />}
            />

            {/* Glassy border segments - rendered on top without blur */}
            <BackdropFilter
                clip={{ x: x - 15, y: y - 15, width: width + 30, height: height + 30 }}
                filter={<ImageFilter filter={borderFilter} />}
            />
        </Canvas>
    );
};
