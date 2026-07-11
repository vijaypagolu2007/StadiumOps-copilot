import type { MultilingualMessage, ScenarioId } from "@/shared/types";

const copy: Record<string, Record<ScenarioId, string>> = {
  en: {
    gateSurge: "For faster entry, use South Gate if you can. East Gate is open but crowded.",
    accessReroute: "Step-free access near East Concourse is being rerouted. Follow teal signs to the West lift bank.",
    stormDelay: "Weather may slow entry. Move to covered concourse areas and follow staff directions.",
    transitCrush: "After the match, exits will open in waves to keep platforms comfortable.",
    sustainability: "Use refill stations and place compost, recycling, and landfill items in signed bins.",
    volunteerGap: "Need help in your language? Scan the help QR code or visit the nearest information point."
  },
  es: {
    gateSurge: "Para entrar mas rapido, use la Puerta Sur si puede. La Puerta Este esta abierta pero concurrida.",
    accessReroute: "El acceso sin escalones cerca de East Concourse esta desviado. Siga las senales color verde azulado.",
    stormDelay: "El clima puede retrasar el ingreso. Dirijase a zonas cubiertas y siga al personal.",
    transitCrush: "Despues del partido, las salidas se abriran por grupos para mantener comodas las plataformas.",
    sustainability: "Use estaciones de recarga y coloque residuos en los contenedores senalizados.",
    volunteerGap: "Necesita ayuda en su idioma? Escanee el codigo QR o visite informacion."
  },
  ar: {
    gateSurge: "For faster entry, use South Gate if possible. East Gate is crowded.",
    accessReroute: "Step-free access near East Concourse is rerouted. Follow teal signs to the West lift bank.",
    stormDelay: "Weather may slow entry. Move to covered concourse areas and follow staff directions.",
    transitCrush: "After the match, exits will open in waves to keep platforms comfortable.",
    sustainability: "Use refill stations and signed waste bins.",
    volunteerGap: "Need help in your language? Scan the QR code or visit information."
  }
};

export function buildMultilingualMessages(scenarioId: ScenarioId): MultilingualMessage[] {
  return Object.entries(copy).map(([language, bundle]) => ({
    language,
    label: language,
    channels: ["app", "led"],
    appText: bundle[scenarioId],
    ledText: bundle[scenarioId],
    dir: language === "ar" ? "rtl" : "ltr"
  }));
}
