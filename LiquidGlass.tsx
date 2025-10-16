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
    // 🧠 Simple shader for static rounded box (no morphing, no circle)
    const source = frag`
${baseUniforms}

vec2 sdRoundedBox(vec2 p, vec2 b, vec4 radius) {
  radius.xy = (p.x > 0.0) ? radius.xy : radius.zw;
  radius.x = (p.y > 0.0) ? radius.x : radius.y;
  vec2 q = abs(p) - b + radius.x;
  float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius.x;
  
  // Use normalized polar coordinates for edge pattern
  float t = atan(p.y, p.x) / (2.0 * 3.14159265) + 0.5;

  return vec2(d, t);
}

half4 main(float2 p) {
  vec2 boxCenter = position;
  vec2 size = vec2(box.z, box.w);
  vec2 pos =  p - boxCenter;

  vec2 sdf = sdRoundedBox(pos, size, vec4(${RADIUS}.0));
  float d = sdf.x;
  float t = sdf.y;

  if (d > 0.0) return vec4(0.0);

  // Gradient from yellow center to alternating red/green edge
  float patternFreq = 3.0; // Number of stripes
  float centerFactor = clamp(-d / r, 1.0, 1.0);
//   float centerFactor = smoothstep(-d / r, 1.0, 1.0);
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

    // 🧠 Dummy uniforms (shader still expects them)
    const uniforms = useDerivedValue(() => {
        return {
            progress: progress.value,
            c1: c1.value,
            box: box,
            r: RADIUS,
            position: [x + width / 2, y + height / 2]
        };
    });
    // Create blur + white overlay filter
    const filter = useDerivedValue(() => {
        const localMatrix = processTransform2d([]);
        const shader = source.makeShader(
            processUniforms(source, uniforms.value),
            localMatrix
        );
        const filter2 = (baseShader: SkShader) => {
            "worklet";

            const shader = Skia.ImageFilter.MakeShader(baseShader);
            const sigma = 20; // Blur intensity
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
                        // whiteTint
                        lightOverlay
                    )
                )
            );
        };
        // Default blur+blend filter if none passed
        return filter2(shader);
    });

    return (
        <View>
            <BackdropFilter
                filter={<ImageFilter filter={filter} />}
            />
        </View>
    );
};
