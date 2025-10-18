import React from 'react';
import { Canvas, Path, Skia, LinearGradient, vec, BlurMask } from '@shopify/react-native-skia';

const GlassRectangle = ({
    width = 300,
    height = 200,
    cornerRadius = 20,
    visiblePercent = 100,
    rectX = 0,
    rectY = 0,
}) => {
    const createCornerPaths = () => {
        const topLeftPath = Skia.Path.Make();
        const bottomRightPath = Skia.Path.Make();

        if (visiblePercent === 50) {
            // Top-left corner: Draw from left edge, around corner, to top edge
            topLeftPath.moveTo(rectX, rectY + cornerRadius);
            // Arc around top-left corner
            topLeftPath.arcToOval(
                Skia.XYWHRect(rectX, rectY, cornerRadius * 2, cornerRadius * 2),
                180, // start angle
                90,  // sweep angle
                false
            );
            // Extend along top edge
            topLeftPath.lineTo(rectX + width * 0.25, rectY);

            // Bottom-right corner: Mirror the top-left logic
            // Start from 25% UP from bottom on the RIGHT edge (mirroring left edge start)
            bottomRightPath.moveTo(rectX + width, rectY + height * 0.75);
            // Go DOWN to the corner start
            bottomRightPath.lineTo(rectX + width, rectY + height - cornerRadius);

            // Create the corner arc
            const bottomRightRect = Skia.XYWHRect(
                rectX + width - cornerRadius * 2,
                rectY + height - cornerRadius * 2,
                cornerRadius * 2,
                cornerRadius * 2
            );

            // Add arc from 0° (right) to 90° (bottom) = 90° sweep (mirroring top-left)
            bottomRightPath.addArc(bottomRightRect, 0, 90);

            // Continue along the bottom edge (mirroring top edge)
            bottomRightPath.lineTo(rectX + width * 0.75, rectY + height);
        }

        return { topLeftPath, bottomRightPath };
    };

    const { topLeftPath, bottomRightPath } = createCornerPaths();

    if (visiblePercent === 50) {
        return (
            <>
                {/* Top-left corner */}
                <Path
                    path={topLeftPath}
                    style="stroke"
                    strokeWidth={4}
                    color="white"
                    opacity={0.7}
                >
                    <LinearGradient
                        // start={vec(rectX, rectY)}
                        // end={vec(rectX + cornerRadius, rectY + cornerRadius)}
                        start={{ x: 0, y: 0.5 }} // start from left center
                        end={{ x: 1, y: 0.5 }}   // end at right center
                        colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.3)']}
                    />
                </Path>

                {/* Bottom-right corner */}
                <Path
                    path={bottomRightPath}
                    style="stroke"
                    strokeWidth={3}
                    color="white"
                >
                    <LinearGradient
                        // start={vec(rectX + width - cornerRadius, rectY + height - cornerRadius)}
                        // end={vec(rectX + width, rectY + height)}
                        // locations={[0, 0.5, 1]} // defines color stops
                        start={{ x: 0, y: 0.5 }} // start from left center
                        end={{ x: 1, y: 0.5 }}   // end at right center
                        colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 1)']}
                    />
                </Path>

                {/* Glows */}
                <Path path={topLeftPath} style="stroke" strokeWidth={2} color="white" opacity={0.3}>
                    <BlurMask blur={18} style="normal" />
                </Path>
                <Path path={bottomRightPath} style="stroke" strokeWidth={2} color="white" opacity={0.3}>
                    <BlurMask blur={8} style="normal" />
                </Path>
            </>
        );
    }

    return null;
};

export default GlassRectangle;