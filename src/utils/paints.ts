/**
 * 7TV Name Paint Utilities
 * Fetches and processes 7TV name paints (cosmetic username styling)
 */

export interface NamePaint {
    id: string;
    name: string;
    // CSS properties for styling
    color?: string;
    backgroundImage?: string;
    filter?: string;
    repeat?: boolean;
    backgroundSize?: string;
    backgroundPosition?: string;
}

// Cache for all available paints (fetched once with TTL)
let globalPaintsCache: Map<string, any> | null = null;
let paintsFetchPromise: Promise<Map<string, any>> | null = null;
let globalPaintsFetchedAt = 0;

// Cache for user paint lookups with TTL
const userPaintCache = new Map<string, { value: NamePaint | null; fetchedAt: number }>();
const pendingUserRequests = new Map<string, Promise<NamePaint | null>>();
const USER_PAINT_TTL = 5 * 60 * 1000; // 5 minutes
const GLOBAL_PAINT_TTL = 10 * 60 * 1000; // 10 minutes

function decodePaintColor(color: number | string): { r: number; g: number; b: number; a: number } {
    if (typeof color === "string") {
        const trimmed = color.trim();
        if (trimmed.startsWith("#")) {
            const hex = trimmed.slice(1);
            if (hex.length === 6) {
                const value = parseInt(hex, 16);
                if (!Number.isNaN(value)) {
                    return {
                        r: (value >> 16) & 0xff,
                        g: (value >> 8) & 0xff,
                        b: value & 0xff,
                        a: 1
                    };
                }
            }
            if (hex.length === 8) {
                const value = parseInt(hex, 16);
                if (!Number.isNaN(value)) {
                    return {
                        r: (value >> 24) & 0xff,
                        g: (value >> 16) & 0xff,
                        b: (value >> 8) & 0xff,
                        a: (value & 0xff) / 255
                    };
                }
            }
        }

        const numeric = Number(trimmed);
        if (!Number.isNaN(numeric)) {
            color = numeric;
        } else {
            return { r: 255, g: 255, b: 255, a: 1 };
        }
    }

    const unsigned = (color as number) >>> 0;
    const r = (unsigned >>> 24) & 0xff;
    const g = (unsigned >> 16) & 0xff;
    const b = (unsigned >> 8) & 0xff;
    const a = (unsigned & 0xff) / 255;
    return { r, g, b, a };
}

function colorToCss(color: { r: number; g: number; b: number; a: number }): string {
    if (color.a >= 0.999) {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

function toOpaque(color: { r: number; g: number; b: number; a: number }) {
    return { ...color, a: 1 };
}

function formatStopPosition(value: number | undefined): number {
    if (value === undefined || Number.isNaN(value)) return 0;
    if (value <= 1) return value * 100;
    if (value <= 100) return value;
    return 100;
}

/**
 * Fetch all global paints from 7TV GraphQL API
 */
async function fetchGlobalPaints(): Promise<Map<string, any>> {
    if (globalPaintsCache && Date.now() - globalPaintsFetchedAt < GLOBAL_PAINT_TTL) {
        return globalPaintsCache;
    }
    if (paintsFetchPromise) return paintsFetchPromise;

    paintsFetchPromise = (async () => {
        try {
            const query = `query{cosmetics{paints{id name function color angle image_url repeat stops{at color}shadows{x_offset y_offset radius color}}}}`;
            const res = await fetch("https://7tv.io/v3/gql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });

            if (!res.ok) {
                console.error("Failed to fetch 7TV paints");
                return new Map();
            }

            const data = await res.json();
            const paints = data?.data?.cosmetics?.paints || [];

            const paintMap = new Map<string, any>();
            for (const paint of paints) {
                paintMap.set(paint.id, paint);
            }

            globalPaintsCache = paintMap;
            globalPaintsFetchedAt = Date.now();
            console.log(`🎨 Loaded ${paintMap.size} 7TV paints`);
            return paintMap;
        } catch (e) {
            console.error("Error fetching 7TV paints:", e);
            return new Map();
        }
    })();

    return paintsFetchPromise;
}

/**
 * Convert 7TV paint data to CSS properties
 */
function paintToCSS(paint: any): NamePaint | null {
    if (!paint) return null;

    const result: NamePaint = {
        id: paint.id || '',
        name: paint.name || '7TV Paint'
    };

    // Handle solid color
    if (paint.color !== undefined && paint.color !== null) {
        const color = decodePaintColor(paint.color);
        result.color = colorToCss(toOpaque(color));
    }

    const isRepeating = Boolean(paint.repeat);

    // Handle gradients & images
    if (paint.function === 'URL' && paint.image_url) {
        result.backgroundImage = `url("${paint.image_url}")`;
        result.repeat = isRepeating;
        result.backgroundSize = isRepeating ? 'auto' : 'cover';
        result.backgroundPosition = 'center';
    } else if (paint.stops && Array.isArray(paint.stops) && paint.stops.length > 0) {
        const gradientStops = paint.stops.map((stop: any) => {
            const color = colorToCss(toOpaque(decodePaintColor(stop.color)));
            const position = formatStopPosition(stop.at);
            return `${color} ${position}%`;
        }).join(', ');

        const angle = paint.angle !== undefined ? paint.angle : 0;
        const fn = String(paint.function || '').toUpperCase();
        const isRadial = fn === 'RADIAL_GRADIENT';
        const isConic = fn === 'CONIC_GRADIENT';

        if (isConic) {
            result.backgroundImage = isRepeating
                ? `repeating-conic-gradient(from ${angle}deg, ${gradientStops})`
                : `conic-gradient(from ${angle}deg, ${gradientStops})`;
        } else if (isRadial) {
            result.backgroundImage = isRepeating
                ? `repeating-radial-gradient(circle, ${gradientStops})`
                : `radial-gradient(circle, ${gradientStops})`;
        } else {
            result.backgroundImage = isRepeating
                ? `repeating-linear-gradient(${angle}deg, ${gradientStops})`
                : `linear-gradient(${angle}deg, ${gradientStops})`;
        }
    }

    // Handle shadows/drop shadows
    if (paint.shadows && Array.isArray(paint.shadows) && paint.shadows.length > 0) {
        const shadows = paint.shadows.map((shadow: any) => {
            const color = colorToCss(toOpaque(decodePaintColor(shadow.color)));
            const x = shadow.x_offset || 0;
            const y = shadow.y_offset || 0;
            const blur = shadow.radius || 0;
            return `drop-shadow(${x}px ${y}px ${blur}px ${color})`;
        }).join(' ');

        result.filter = shadows;
    }

    return result;
}

/**
 * Fetch 7TV name paint for a user
 */
export async function get7TVUserPaint(
    userId: string,
    platform: 'twitch' | 'kick' | 'youtube' = 'twitch'
): Promise<NamePaint | null> {
    const cacheKey = `${platform}:${userId}`;
    const cached = userPaintCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < USER_PAINT_TTL) {
        return cached.value || null;
    }

    if (pendingUserRequests.has(cacheKey)) {
        return pendingUserRequests.get(cacheKey)!;
    }

    const promise = (async () => {
        try {
            // Ensure global paints are loaded
            const allPaints = await fetchGlobalPaints();

            // Fetch user data
            const res = await fetch(`https://7tv.io/v3/users/${platform}/${userId}`);
            if (!res.ok) {
                userPaintCache.set(cacheKey, { value: null, fetchedAt: Date.now() });
                return null;
            }

            const data = await res.json();

            // Check for paint_id in user.style
            const paintId = data.user?.style?.paint_id;
            if (paintId && allPaints.has(paintId)) {
                const paintData = allPaints.get(paintId);
                const paint = paintToCSS(paintData);
                userPaintCache.set(cacheKey, { value: paint, fetchedAt: Date.now() });
                return paint;
            }

            // Fallback: check for solid color in user.style
            if (data.user?.style?.color !== undefined && data.user?.style?.color !== null) {
                const result: NamePaint = {
                    id: 'solid-color',
                    name: 'Solid Color',
                    color: colorToCss(toOpaque(decodePaintColor(data.user.style.color)))
                };
                userPaintCache.set(cacheKey, { value: result, fetchedAt: Date.now() });
                return result;
            }

            userPaintCache.set(cacheKey, { value: null, fetchedAt: Date.now() });
            return null;
        } catch (e) {
            console.error('Failed to fetch 7TV paint for user:', userId, e);
            userPaintCache.set(cacheKey, { value: null, fetchedAt: Date.now() });
            return null;
        } finally {
            pendingUserRequests.delete(cacheKey);
        }
    })();

    pendingUserRequests.set(cacheKey, promise);
    return promise;
}

/**
 * Pre-load global paints (call on app init)
 */
export async function preloadPaints(): Promise<void> {
    await fetchGlobalPaints();
}

/**
 * Generate inline styles for a name paint
 */
export function getNamePaintStyles(paint: NamePaint | null): {
    style: { [key: string]: string };
} {
    if (!paint) {
        return { style: {} };
    }

    const style: { [key: string]: string } = {};

    if (paint.backgroundImage) {
        // Use background-clip for gradient or image text
        style['background-image'] = paint.backgroundImage;
        if (paint.backgroundSize || paint.backgroundPosition || paint.repeat) {
            style['background-size'] = paint.backgroundSize || 'cover';
            style['background-position'] = paint.backgroundPosition || 'center';
            style['background-repeat'] = paint.repeat ? 'repeat' : 'no-repeat';
        }
        style['display'] = 'inline-block';
        style['background-clip'] = 'text';
        style['-webkit-background-clip'] = 'text';
        style['-webkit-text-fill-color'] = 'transparent';
        style['color'] = 'transparent';
    } else if (paint.color) {
        style['color'] = paint.color;
    }

    if (paint.filter) {
        style['filter'] = paint.filter;
    }

    return { style };
}
