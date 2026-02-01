/**
 * 7TV Name Paint Utilities
 * Fetches and processes 7TV name paints (cosmetic username styling)
 */

export interface NamePaint {
    id: string;
    name: string;
    // CSS properties for styling
    color?: string;
    background?: string;
    backgroundImage?: string;
    filter?: string;
    image_url?: string;
}

// Cache for all available paints (fetched once)
let globalPaintsCache: Map<string, any> | null = null;
let paintsFetchPromise: Promise<Map<string, any>> | null = null;

// Cache for user paint lookups
const userPaintCache = new Map<string, NamePaint | null>();
const pendingUserRequests = new Map<string, Promise<NamePaint | null>>();

/**
 * Decode 7TV color int32 to RGBA string
 * Colors are signed int32 in ARGB format
 */
function decodeColor(color: number): string {
    // Handle signed int32 - convert to unsigned
    const unsigned = color >>> 0;
    const a = ((unsigned >>> 24) & 0xFF) / 255;
    const r = (unsigned >> 16) & 0xFF;
    const g = (unsigned >> 8) & 0xFF;
    const b = unsigned & 0xFF;

    // If alpha is 0, default to 1 (fully opaque)
    const alpha = a === 0 ? 1 : a;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Fetch all global paints from 7TV GraphQL API
 */
async function fetchGlobalPaints(): Promise<Map<string, any>> {
    if (globalPaintsCache) return globalPaintsCache;
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
        result.color = decodeColor(paint.color);
    }

    // Handle gradients & images
    if (paint.function === 'URL' && paint.image_url) {
        result.backgroundImage = `url("${paint.image_url}")`;
        result.background = `url("${paint.image_url}")`; // Fallback/base
    } else if (paint.stops && Array.isArray(paint.stops) && paint.stops.length > 0) {
        const gradientStops = paint.stops.map((stop: any) => {
            const color = decodeColor(stop.color);
            const position = stop.at !== undefined ? stop.at * 100 : 0;
            return `${color} ${position}%`;
        }).join(', ');

        const angle = paint.angle !== undefined ? paint.angle : 0;
        const isRadial = paint.function === 'RADIAL_GRADIENT';

        if (isRadial) {
            result.background = `radial-gradient(circle, ${gradientStops})`;
        } else {
            result.background = `linear-gradient(${angle}deg, ${gradientStops})`;
        }
    }

    // Handle shadows/drop shadows
    if (paint.shadows && Array.isArray(paint.shadows) && paint.shadows.length > 0) {
        const shadows = paint.shadows.map((shadow: any) => {
            const color = decodeColor(shadow.color);
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
export async function get7TVUserPaint(userId: string): Promise<NamePaint | null> {
    if (userPaintCache.has(userId)) {
        return userPaintCache.get(userId) || null;
    }

    if (pendingUserRequests.has(userId)) {
        return pendingUserRequests.get(userId)!;
    }

    const promise = (async () => {
        try {
            // Ensure global paints are loaded
            const allPaints = await fetchGlobalPaints();

            // Fetch user data
            const res = await fetch(`https://7tv.io/v3/users/twitch/${userId}`);
            if (!res.ok) {
                userPaintCache.set(userId, null);
                return null;
            }

            const data = await res.json();

            // Check for paint_id in user.style
            const paintId = data.user?.style?.paint_id;
            if (paintId && allPaints.has(paintId)) {
                const paintData = allPaints.get(paintId);
                const paint = paintToCSS(paintData);
                userPaintCache.set(userId, paint);
                return paint;
            }

            // Fallback: check for solid color in user.style
            if (data.user?.style?.color !== undefined && data.user?.style?.color !== null) {
                const result: NamePaint = {
                    id: 'solid-color',
                    name: 'Solid Color',
                    color: decodeColor(data.user.style.color)
                };
                userPaintCache.set(userId, result);
                return result;
            }

            userPaintCache.set(userId, null);
            return null;
        } catch (e) {
            console.error('Failed to fetch 7TV paint for user:', userId, e);
            userPaintCache.set(userId, null);
            return null;
        } finally {
            pendingUserRequests.delete(userId);
        }
    })();

    pendingUserRequests.set(userId, promise);
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

    if (paint.backgroundImage || paint.background) {
        // Use background-clip for gradient or image text
        style['background-image'] = paint.backgroundImage || paint.background!;
        if (paint.background && !paint.backgroundImage) {
            style['background'] = paint.background;
        }
        style['background-size'] = 'cover';
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
