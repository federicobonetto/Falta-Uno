type PlayerPreference = {
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  searchMode: "radius" | "place";
  searchRadiusKm: number;
  preferredPlace: string | null;
};

type MatchLocation = {
  club: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
};

function normalize(value: string | null) {
  return value?.trim().toLocaleLowerCase("es-AR") ?? "";
}

function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchFitsPreference(player: PlayerPreference, match: MatchLocation) {
  if (player.searchMode === "place" && player.preferredPlace) {
    return normalize(match.club).includes(normalize(player.preferredPlace));
  }

  if (
    player.latitude != null && player.longitude != null
    && match.latitude != null && match.longitude != null
  ) {
    return distanceInKm(player.latitude, player.longitude, match.latitude, match.longitude)
      <= player.searchRadiusKm;
  }

  const playerLocation = normalize(player.location);
  const matchLocation = normalize(match.location);
  if (playerLocation && matchLocation) {
    return playerLocation.includes(matchLocation) || matchLocation.includes(playerLocation);
  }

  return true;
}
