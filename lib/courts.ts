export type PadelCourt = {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  mapsUrl?: string;
};

// Sedes de Olavarría. La opción manual permite sumar complejos nuevos sin
// bloquear la creación de un partido.
export const OLAVARRIA_COURTS: PadelCourt[] = [
  { id: "chingoland", name: "Chingoland", address: "Río Negro 4651", latitude: -36.896873, longitude: -60.2867829, rating: 4.9 },
  { id: "runa-padel", name: "Runa Pádel", address: "Lebensohn 1850", latitude: -36.8746357, longitude: -60.3144985, rating: 5 },
  { id: "padel-time", name: "Pádel Time", address: "Ramón Rendón 1679", latitude: -36.8961638, longitude: -60.34433, rating: 4.7 },
  { id: "las-terrazzas", name: "Las Terrazzas Pádel", address: "Collinet 2784", latitude: -36.902367, longitude: -60.3338969, rating: 4.6 },
  { id: "sport-arena", name: "Sport Arena Pádel", address: "Las Heras 1358", latitude: -36.8899754, longitude: -60.3418671, rating: 4.6 },
  { id: "la-esperanza", name: "Pádel La Esperanza", address: "Av. Colón 1551", latitude: -36.8812457, longitude: -60.327521, rating: 4.6 },
  { id: "el-triunfo", name: "El Triunfo", address: "Av. Del Valle 1050", latitude: -36.8864813, longitude: -60.3418652, rating: 4.6 },
  { id: "oasis-padel", name: "Oasis Pádel", address: "Independiente 3172", latitude: -36.8851083, longitude: -60.3267173, rating: 4.5 },
  { id: "lagartos", name: "Lagartos Pádel", address: "Av. Del Valle 3823", latitude: -36.9045829, longitude: -60.3185813, rating: 4.5 },
  { id: "club-de-amigos", name: "Club de Amigos", address: "Av. Ituzaingó 950", latitude: -36.8988233, longitude: -60.3484362, rating: 4.5 },
  { id: "nuevo-jardin", name: "El Nuevo Jardín", address: "Av. de los Trabajadores 3749", latitude: -36.8886505, longitude: -60.2995677, rating: 4.4 },
  { id: "serrano-padel", name: "Serrano Pádel", address: "Av. Pellegrini 5400", latitude: -36.8886442, longitude: -60.2855346, rating: 4.2 },
  { id: "norte-padel", name: "Norte Pádel Club", address: "Av. de los Trabajadores 3293", latitude: -36.8848288, longitude: -60.3031728, rating: 3.7 },
];
