/**
 * Calculate the great-circle distance between two points on the Earth's surface.
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in meters
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in metres
}

/**
 * Projects a set of boreholes onto a 1D line based on their cumulative distance.
 * Assumes boreholes are provided in spatial order (e.g., West to East).
 */
export function calculateCumulativeDistances(
    boreholes: Array<{ id: number; lat: number; lon: number }>
): Record<number, number> {
    const distances: Record<number, number> = {};
    if (boreholes.length === 0) return distances;

    distances[boreholes[0].id] = 0;
    let cumulative = 0;

    for (let i = 1; i < boreholes.length; i++) {
        const prev = boreholes[i - 1];
        const curr = boreholes[i];
        const dist = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
        cumulative += dist;
        distances[curr.id] = cumulative;
    }

    return distances;
}
