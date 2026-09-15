export interface Subject {
  code: string;
  name: string;
  teacher: string;
  room?: string;
}

export interface SchedulePeriod {
  start: string;
  end: string;
  isBreak?: boolean;
  block?: string; // e.g. "Modalidad A", "Optativas Bloque 1", "Libre Configuración"
  subjects: Subject[]; // Multiple for optativas / modalidad
}

export const SUBJECT_NAMES: Record<string, string> = {
  Ingl: "Lengua Extranjera II (Inglés)",
  Hes: "Historia de España",
  LCa: "Lengua Castellana y Literatura II",
  LGa: "Lengua Gallega y Literatura II",
  HFil: "Historia de la Filosofía",
  MatII: "Matemáticas II",
  LatII: "Latín II",
  MatCCSS: "Matemáticas Aplicadas a las Ciencias Sociales II",
  Qui: "Química",
  Emp: "Empresa y Diseño de Modelos de Negocio",
  Gri: "Griego II",
  TIC2: "Tecnologías de la Inf. y Com. II (TIC II)",
  Fr2: "Segunda Lengua Extranjera (Francés II)",
  Psi: "Psicología",
  MetEst: "Métodos Estadísticos y Numéricos",
  Bio: "Biología",
  Fis: "Física",
  HArte: "Historia del Arte",
  Geo: "Geografía",
  IngProf: "Profundización en Inglés",
  AFPS: "Actividad Física y Promoción de la Salud",
  Rel: "Religión Católica",
};

const BLOCKS = {
  modalidadA: "Modalidad A",
  modalidadB: "Modalidad B",
  optativas1: "Optativas Bloque 1",
  optativas2: "Optativas Bloque 2",
  libre: "Libre Configuración",
};

const TIMES = [
  { start: "08:45", end: "09:35" },
  { start: "09:35", end: "10:25" },
  { start: "10:25", end: "10:45", isBreak: true },
  { start: "10:45", end: "11:35" },
  { start: "11:35", end: "12:25" },
  { start: "12:25", end: "12:45", isBreak: true },
  { start: "12:45", end: "13:35" },
  { start: "13:35", end: "14:25" },
  { start: "16:30", end: "17:20" }, // Martes tarde
  { start: "17:20", end: "18:10" }, // Martes tarde
];

const modalidadA: Subject[] = [
  { code: "MatII", name: SUBJECT_NAMES.MatII, teacher: "Rocío Oreiro Rey" },
  { code: "LatII", name: SUBJECT_NAMES.LatII, teacher: "Mª Carmen Rama Faya" },
  { code: "MatCCSS", name: SUBJECT_NAMES.MatCCSS, teacher: "Inmaculada Rodríguez" },
];

const modalidadB: Subject[] = [
  { code: "Qui", name: SUBJECT_NAMES.Qui, teacher: "Pedro J. del Pozo Toscano" },
  { code: "Emp", name: SUBJECT_NAMES.Emp, teacher: "Montserrat Peña Losada" },
  { code: "Gri", name: SUBJECT_NAMES.Gri, teacher: "Mª Carmen Rama Faya" },
];

const optativas1: Subject[] = [
  { code: "TIC2", name: SUBJECT_NAMES.TIC2, teacher: "Esther Tarrío Tato" },
  { code: "Fr2", name: SUBJECT_NAMES.Fr2, teacher: "Begoña Lourido" },
  { code: "Psi", name: SUBJECT_NAMES.Psi, teacher: "José Ardid Vera" },
  { code: "MetEst", name: SUBJECT_NAMES.MetEst, teacher: "Rocío Oreiro Rey" },
];

const optativas2: Subject[] = [
  { code: "Bio", name: SUBJECT_NAMES.Bio, teacher: "J. Margarita Santos" },
  { code: "Fis", name: SUBJECT_NAMES.Fis, teacher: "Mar Real" },
  { code: "HArte", name: SUBJECT_NAMES.HArte, teacher: "Silvia Collazo" },
  { code: "Geo", name: SUBJECT_NAMES.Geo, teacher: "Adela Figueroa Paz" },
];

const libreConfiguracion: Subject[] = [
  { code: "IngProf", name: SUBJECT_NAMES.IngProf, teacher: "Paula Mariño" },
  { code: "AFPS", name: SUBJECT_NAMES.AFPS, teacher: "José Manuel Rodríguez" },
  { code: "Rel", name: SUBJECT_NAMES.Rel, teacher: "Miguel F. Mociño Fernández" },
];

const comun = (code: string, teacher: string, room?: string): Subject => ({
  code,
  name: SUBJECT_NAMES[code],
  teacher,
  ...(room ? { room } : {}),
});

export const SCHEDULE: Record<number, SchedulePeriod[]> = {
  1: [ // Lunes
    { ...TIMES[0], subjects: [comun("Ingl", "Marta Villoch")] },
    { ...TIMES[1], subjects: [comun("LCa", "Juan C. Sanmartín")] },
    { ...TIMES[2], subjects: [], isBreak: true },
    { ...TIMES[3], subjects: [comun("Hes", "Carlos de Artaza")] },
    { ...TIMES[4], subjects: optativas1, block: BLOCKS.optativas1 },
    { ...TIMES[5], subjects: [], isBreak: true },
    { ...TIMES[6], subjects: [comun("HFil", "José Ardid Vera")] },
    { ...TIMES[7], subjects: [comun("LGa", "Libia Pérez Vázquez")] },
  ],
  2: [ // Martes
    { ...TIMES[0], subjects: [comun("Hes", "Carlos de Artaza")] },
    { ...TIMES[1], subjects: [comun("HFil", "José Ardid Vera")] },
    { ...TIMES[2], subjects: [], isBreak: true },
    { ...TIMES[3], subjects: modalidadB, block: BLOCKS.modalidadB },
    { ...TIMES[4], subjects: modalidadA, block: BLOCKS.modalidadA },
    { ...TIMES[5], subjects: [], isBreak: true },
    { ...TIMES[6], subjects: [comun("Ingl", "Marta Villoch")] },
    { ...TIMES[7], subjects: optativas2, block: BLOCKS.optativas2 },
    { ...TIMES[8], subjects: [comun("LGa", "Libia Pérez Vázquez")] },
    { ...TIMES[9], subjects: optativas1, block: BLOCKS.optativas1 },
  ],
  3: [ // Miércoles
    { ...TIMES[0], subjects: modalidadA, block: BLOCKS.modalidadA },
    { ...TIMES[1], subjects: [comun("LCa", "Juan C. Sanmartín")] },
    { ...TIMES[2], subjects: [], isBreak: true },
    { ...TIMES[3], subjects: optativas1, block: BLOCKS.optativas1 },
    { ...TIMES[4], subjects: libreConfiguracion, block: BLOCKS.libre },
    { ...TIMES[5], subjects: [], isBreak: true },
    { ...TIMES[6], subjects: optativas2, block: BLOCKS.optativas2 },
    { ...TIMES[7], subjects: modalidadB, block: BLOCKS.modalidadB },
  ],
  4: [ // Jueves
    { ...TIMES[0], subjects: [comun("LGa", "Libia Pérez Vázquez")] },
    { ...TIMES[1], subjects: [comun("LCa", "Juan C. Sanmartín")] },
    { ...TIMES[2], subjects: [], isBreak: true },
    { ...TIMES[3], subjects: modalidadB, block: BLOCKS.modalidadB },
    { ...TIMES[4], subjects: modalidadA, block: BLOCKS.modalidadA },
    { ...TIMES[5], subjects: [], isBreak: true },
    { ...TIMES[6], subjects: optativas2, block: BLOCKS.optativas2 },
    { ...TIMES[7], subjects: [comun("Ingl", "Marta Villoch")] },
  ],
  5: [ // Viernes
    { ...TIMES[0], subjects: optativas1, block: BLOCKS.optativas1 },
    { ...TIMES[1], subjects: modalidadB, block: BLOCKS.modalidadB },
    { ...TIMES[2], subjects: [], isBreak: true },
    { ...TIMES[3], subjects: optativas2, block: BLOCKS.optativas2 },
    { ...TIMES[4], subjects: [comun("HFil", "José Ardid Vera")] },
    { ...TIMES[5], subjects: [], isBreak: true },
    { ...TIMES[6], subjects: modalidadA, block: BLOCKS.modalidadA },
    { ...TIMES[7], subjects: [comun("Hes", "Carlos de Artaza")] },
  ],
};