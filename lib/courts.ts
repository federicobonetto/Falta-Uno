export type PadelCourt = {
  id: string;
  name: string;
  address?: string;
};

// Sedes de Olavarría. La opción manual permite sumar complejos nuevos sin
// bloquear la creación de un partido.
export const OLAVARRIA_COURTS: PadelCourt[] = [
  { id: "chingoland", name: "Chingoland", address: "Río Negro 4651 (Área 226)" },
  { id: "club-de-amigos", name: "Club de Amigos", address: "Ituzaingó 850" },
  { id: "el-triunfo", name: "El Triunfo", address: "Av. Del Valle 1050" },
  { id: "lagartos", name: "Lagartos Pádel", address: "Av. Del Valle 3823" },
  { id: "las-terrazzas", name: "Las Terrazzas Pádel", address: "Collinet 2784" },
  { id: "padel-time", name: "Pádel Time", address: "Rendón 1679" },
  { id: "parking-padel", name: "Parking Pádel", address: "Independencia 2629" },
  { id: "serrano-padel", name: "Serrano Pádel", address: "Av. Pellegrini 5400" },
  { id: "sport-arena", name: "Sport Arena" },
  { id: "runa-padel", name: "Runa Pádel" },
];
