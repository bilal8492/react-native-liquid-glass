import React from 'react';
import { Canvas, BackdropFilter, ImageFilter, Skia, TileMode, BlendMode, SkSize, vec, mix, processTransform2d, processUniforms, SkShader, ColorChannel, Rect, Paint, Shader, RoundedRect } from '@shopify/react-native-skia';
import { View, } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

type Value = string | number;
type Values = Value[];
const glsl = (source: TemplateStringsArray, ...values: Values) => {
    const processed = source.flatMap((s, i) => [s, values[i] ?? '']).filter(v => v !== undefined && v !== null);
    return processed.join("");
};


const frag = (source: TemplateStringsArray, ...values: Values) => {
    const code = glsl(source, ...values);
    const rt = Skia.RuntimeEffect.Make(code);
    if (rt === null) {
        throw new Error("Couln't Compile Shader");
    }
    return rt;
};

export const LiquidGlass = ({ width, height, x = 0, y = 0, radius = 0 }) => {

    const RADIUS = radius;
    const baseUniforms = glsl`
        uniform float progress;
        uniform vec2 c1;
        uniform vec4 box;
        uniform float r;
        uniform vec2 position;
    `;
    
    // 🧠 Shader for the BORDER ONLY (glassy with less blur)
    const borderSource = frag`
${baseUniforms}

vec2 sdRoundedBox(vec2 p, vec2 b, vec4 radius) {
  radius.xy = (p.x > 0.0) ? radius.xy : radius.zw;
  radius.x = (p.y > 0.0) ? radius.x : radius.y;
  vec2 q = abs(p) - b + radius.x;
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius.x;
  
  // Normalized angle around perimeter (0 = right, 0.25 = top, 0.5 = left, 0.75 = bottom)
  float angle = atan(p.y, p.x);
  float t = angle / (2.0 * 3.14159265);
  if (t < 0.0) t += 1.0; // Normalize to 0-1 range

  return vec2(d, t);
}

half4 main(float2 p) {
  vec2 boxCenter = position;
  vec2 size = vec2(box.z, box.w);
  vec2 pos =  p - boxCenter;

  vec2 sdf = sdRoundedBox(pos, size, vec4(${RADIUS}.0));
  float d = sdf.x;
  float t = sdf.y;

  // ============ OUTER GLASSY BORDER - 50% VISIBLE (25% top-left + 25% bottom-right) ============
  float borderThickness = 3.0;
  
  // Check if we're in the INNER border region (inside the shape, near the edge)
  // Changed from: if (d > borderThickness) to make border grow inward
  if (d < -borderThickness) return vec4(0.0); // Outside the border region (too far inside)
  
  // Only render the border (d > -borderThickness means we're near or outside edge)
  if (d < 0.0) { // Changed from: if (d > 0.0) - now renders INSIDE the shape
    // Border fade (smooth edges)
    float borderMask = smoothstep(-borderThickness, -borderThickness + 2.0, d) * smoothstep(1.0, -1.0, d);
    
    // Create 50% visibility: top-left (25%) + bottom-right (25%)
    // t=0 is right, t=0.25 is top, t=0.5 is left, t=0.75 is bottom, t=1.0 wraps to right

    float segmentMask = 0.0;

    // Top-left segment: wrapping through t=0.0
    // This covers: bottom-left corner -> top -> top-right corner
    if (t >= 0.975 || t <= 0.465) {
      float fadeIn = 0.0;
      float fadeOut = 0.0;
      
      if (t >= 0.975) {
        // Part 1: fade in from 0.975 to 1.0 (approaching wrap point) - LONGER FADE
        fadeIn = smoothstep(0.975, 0.999, t); // longer fade in from start
        fadeOut = 1.0; // Stay visible at the wrap point
        segmentMask = fadeIn * fadeOut;
      } else if (t <= 0.465) {
        // Part 2: after wrap, stay visible then fade out at end - LONGER FADE
        fadeIn = 1.0; // Fully visible after the wrap
        fadeOut = smoothstep(0.465, 0.420, t); // longer fade out at end
        segmentMask = fadeIn * fadeOut;
      }
    }
    
    // Bottom-right segment: 25% from t=0.375 to t=0.625
    // This covers: right-bottom corner -> bottom -> left-bottom corner
    if (t >= 0.490 && t <= 0.585) { // 1st param will define where the segment starts 2nd param defines where it ends
      // fadeIn: gradually increases from 0.490 to 0.525 (longer fade in from start)
      float fadeIn = smoothstep(0.490, 0.525, t); // fade in from left (longer fade)
      // fadeOut: gradually decreases from 0.550 to 0.585 (longer fade out at end)
      float fadeOut = smoothstep(0.585, 0.550, t); // fade out at right (longer fade)
      segmentMask = max(segmentMask, fadeIn * fadeOut);
    }
    
    // If not in any segment, return transparent
    if (segmentMask < 0.01) return vec4(0.0);
    
    // Pure white for glassy border
    vec3 whiteColor = vec3(1.0, 1.0, 1.0);
    
    // Apply masks with higher opacity for better visibility
    float finalAlpha = borderMask * segmentMask * 0.9;
    
    return vec4(whiteColor, finalAlpha);
  }
  
  // Inside the shape - return transparent for border shader
  return vec4(0.0);
}
`;

    // 🧠 Shader for the GLASS EFFECT (with blur)
    const glassSource = frag`
${baseUniforms}

vec2 sdRoundedBox(vec2 p, vec2 b, vec4 radius) {
  radius.xy = (p.x > 0.0) ? radius.xy : radius.zw;
  radius.x = (p.y > 0.0) ? radius.x : radius.y;
  vec2 q = abs(p) - b + radius.x;
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius.x;
  
  // Use normalized polar coordinates for edge pattern
  float t = atan(p.y, p.x) / (2.0 * 3.14159265) + 0.59;

  return vec2(d, t);
}

half4 main(float2 p) {
  vec2 boxCenter = position;
  vec2 size = vec2(box.z, box.w);
  vec2 pos =  p - boxCenter;

  vec2 sdf = sdRoundedBox(pos, size, vec4(${RADIUS}.0));
  float d = sdf.x;
  float t = sdf.y;

  // Only render inside the shape (d <= 0)
  if (d > 0.0) return vec4(0.0);

  // Original inner content
  float patternFreq = 3.0;
  float centerFactor = clamp(-d / r, 1.0, 1.0);
  float edgePattern = sin(t * 2.0 * 3.14159265 * patternFreq) * 0.5 + 0.5;

  vec3 yellow = vec3(0.9, 0.8, 0.0);
  vec3 red = vec3(0.9, 0.2, 0.2);
  vec3 green = vec3(0.2, 0.8, 0.2);
  vec3 edgeColor = mix(red, green, edgePattern);

  vec3 color = mix(edgeColor, yellow, centerFactor);
  
  return vec4(color, 1.0);
}
`;

    const useButtonGroup = (container: SkSize, r: number) => {
        const width = 7 * r;
        const height = 2 * r;
        const x = (container.width - width) / 2;
        const y = (container.height - height) / 2;
        const progress = useSharedValue(0);
        const box = [2.5 * r, 0, 4.5 * r, 2 * r];
        const c1 = useDerivedValue(() => vec(mix(progress.value, r, 3.5 * r), 0));
        const c2 = useDerivedValue(() => vec(3.5 * r, 0));
        const c3 = useDerivedValue(() => vec(6 * r, 0));
        return { progress, c1, box, bounds: { x, y, width, height }, r, c2, c3 };
    };
    const r = 55;

    const props = useButtonGroup({ width: width, height: height }, r);
    const { progress, c1, bounds } = props;

    const box = [width / 2, height / 2, width / 2, height / 2];

    // 🧠 Uniforms for both shaders
    const uniforms = useDerivedValue(() => {
        return {
            progress: progress.value,
            c1: c1.value,
            box: box,
            r: RADIUS,
            position: [x + width / 2, y + height / 2]
        };
    });

    // Create blur filter for glass effect only
    const glassFilter = useDerivedValue(() => {
        const localMatrix = processTransform2d([]);
        const shader = glassSource.makeShader(
            processUniforms(glassSource, uniforms.value),
            localMatrix
        );

        const filter2 = (baseShader: SkShader) => {
            "worklet";

            const shader = Skia.ImageFilter.MakeShader(baseShader);
            const sigma = 8; // Blur intensity
            // BlendMode.SrcIn keeps the shader only where the backdrop is visible (inside the box)
            const blendFilter = Skia.ImageFilter.MakeBlend(BlendMode.SrcIn, shader);

            // ✨ Add soft lighting gradient from top-left to bottom-right
            const lightingGradient = Skia.Shader.MakeLinearGradient(
                // start point (top-left)
                vec(0, 0),
                // end point (bottom-right)
                vec(width, height),
                // gradient colors
                [
                    Skia.Color("rgba(255, 255, 255, 0.49)"), // light source
                    Skia.Color("rgba(255, 0, 0, 0.05)"), // middle glow
                    Skia.Color("rgba(179, 1, 1, 0)")         // fade out bottom-right
                ],
                null, // positions automatically spaced
                TileMode.Clamp
            );

            // Use the dark tint + lighting together
            const whiteTint = Skia.ImageFilter.MakeShader(
                Skia.Shader.MakeColor(Skia.Color("rgba(255, 255, 255, 0.25)"))
            );

            // Combine tint and light gradient
            const lightOverlay = Skia.ImageFilter.MakeBlend(
                BlendMode.Screen, // adds light without flattening
                whiteTint,
                Skia.ImageFilter.MakeShader(lightingGradient)
            );

            const displacementMap = Skia.ImageFilter.MakeDisplacementMap(
                ColorChannel.R,
                ColorChannel.G,
                40,
                shader
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
                        whiteTint
                        // lightOverlay
                    )
                )
            );
        };
        return filter2(shader);
    });

    // Create filter for border (glassy effect with backdrop blur)
    const borderFilter = useDerivedValue(() => {
        const localMatrix = processTransform2d([]);
        const shader = borderSource.makeShader(
            processUniforms(borderSource, uniforms.value),
            localMatrix
        );

        const filter2 = (baseShader: SkShader) => {
            "worklet";
            const shaderFilter = Skia.ImageFilter.MakeShader(baseShader);
            
            // Moderate blur for glassy effect (less than inner glass)
            const sigma = 0; // Noticeable blur for glass effect
            
            // Blend shader with backdrop to create glass effect
            const blendFilter = Skia.ImageFilter.MakeBlend(BlendMode.SrcIn, shaderFilter);
            
            // White tint for frosted glass appearance
            const glassTint = Skia.ImageFilter.MakeShader(
                Skia.Shader.MakeColor(Skia.Color("rgba(251, 251, 251, 0.97)"))
            );
            
            // Light gradient from top-left to bottom-right for depth
            const lightGradient = Skia.Shader.MakeLinearGradient(
                vec(0, 0), // top-left
                vec(width, height), // bottom-right
                [
                    Skia.Color("rgba(255, 255, 255, 1)"), // top-left brighter
                    Skia.Color("rgba(255, 255, 255, 0.4)"), // top-left bright
                    Skia.Color("rgba(255, 255, 255, 0.2)"), // middle bright
                    Skia.Color("rgba(255, 255, 255, 0.1)"), // bottom-right subtle
                    Skia.Color("rgba(255, 255, 255, 0.05)")  // bottom-right subtle
                ],
                null,
                TileMode.Clamp
            );
            
            const gradientFilter = Skia.ImageFilter.MakeShader(lightGradient);
            
            // Subtle displacement for refractive glass effect
            const displacementMap = Skia.ImageFilter.MakeDisplacementMap(
                ColorChannel.R,
                ColorChannel.G,
                15, // Light displacement for subtle refraction
                shaderFilter
            );
            
            // Combine blur + backdrop + tint + gradient for glassy border
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
                            BlendMode.Screen, // Adds brightness/glow
                            glassTint,
                            gradientFilter
                        )
                    )
                )
            );
        };
        return filter2(shader);
    });

    return (
        <View>
            {/* Glass effect with blur */}
            <BackdropFilter
                clip={{ x, y, width, height }}
                filter={<ImageFilter filter={glassFilter} />}
            />
            {/* Border without blur - rendered on top */}
            <BackdropFilter
                clip={{ x: x - 15, y: y - 15, width: width + 30, height: height + 30 }}
                filter={<ImageFilter filter={borderFilter} />}
            />
        </View>
    );
};
