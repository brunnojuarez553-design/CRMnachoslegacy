export type RepairStageKey =
  | "vehicle_received"
  | "repair_started"
  | "body_work"
  | "paint"
  | "reassembly"
  | "quality_control"
  | "ready_for_pickup"
  | "delivered";

export const REPAIR_STAGES: { key: RepairStageKey; en: string; es: string }[] = [
  { key: "vehicle_received", en: "Vehicle Received", es: "Vehículo recibido" },
  { key: "repair_started", en: "Repair Started", es: "Reparación iniciada" },
  { key: "body_work", en: "Body Work", es: "Carrocería" },
  { key: "paint", en: "Paint", es: "Pintura" },
  { key: "reassembly", en: "Reassembly", es: "Rearmado" },
  { key: "quality_control", en: "Quality Control", es: "Control de calidad" },
  { key: "ready_for_pickup", en: "Ready for Pickup", es: "Listo para retirar" },
  { key: "delivered", en: "Delivered", es: "Entregado" },
];

export function stageLabel(stage: string, language: "en" | "es" = "en") {
  const found = REPAIR_STAGES.find((item) => item.key === stage);
  return found ? found[language] : stage.replaceAll("_", " ");
}

export function buildRepairSms(input: {
  stage: RepairStageKey;
  customerName?: string | null;
  vehicle?: string | null;
  language?: "en" | "es";
}) {
  const firstName = (input.customerName || "").trim().split(/\s+/)[0] || (input.language === "es" ? "cliente" : "there");
  const vehicle = input.vehicle ? ` ${input.vehicle}` : input.language === "es" ? " tu vehículo" : " your vehicle";
  const es = input.language === "es";
  const messages: Record<RepairStageKey, string> = es
    ? {
        vehicle_received: `Hola ${firstName}, Nacho's Legacy recibió${vehicle}. Ya registramos el ingreso y te mantendremos informado sobre el avance.`,
        repair_started: `Hola ${firstName}, comenzamos la reparación de${vehicle} en Nacho's Legacy. Te iremos informando a medida que avance el trabajo.`,
        body_work: `Hola ${firstName},${vehicle} se encuentra en la etapa de reparación de carrocería en Nacho's Legacy. Seguimos avanzando con el trabajo.`,
        paint: `Hola ${firstName}, actualización de Nacho's Legacy: ${vehicle.trim()} pasó a la etapa de pintura. Te avisaremos cuando avance a la próxima etapa.`,
        reassembly: `Hola ${firstName},${vehicle} ya está en rearmado en Nacho's Legacy. La reparación sigue avanzando según lo previsto.`,
        quality_control: `Hola ${firstName},${vehicle} se encuentra en control de calidad final en Nacho's Legacy. Estamos verificando el trabajo antes de la entrega.`,
        ready_for_pickup: `¡Buenas noticias, ${firstName}!${vehicle} está listo para retirar en Nacho's Legacy. Comunicate con nosotros si necesitás coordinar la entrega.`,
        delivered: `Gracias, ${firstName}, por confiar en Nacho's Legacy. Registramos${vehicle} como entregado. Fue un placer ayudarte.`,
      }
    : {
        vehicle_received: `Hi ${firstName}, Nacho's Legacy has received${vehicle}. Your check-in is recorded and we'll keep you updated as the repair progresses.`,
        repair_started: `Hi ${firstName}, repair work has started on${vehicle} at Nacho's Legacy. We'll keep you updated as the work progresses.`,
        body_work: `Hi ${firstName},${vehicle} is currently in the body repair stage at Nacho's Legacy. Work is moving forward and we'll keep you updated.`,
        paint: `Hi ${firstName}, quick update from Nacho's Legacy: ${vehicle.trim()} has now moved into the paint stage. We'll let you know when it advances to the next step.`,
        reassembly: `Hi ${firstName},${vehicle} is now in reassembly at Nacho's Legacy. The repair is continuing to move forward.`,
        quality_control: `Hi ${firstName},${vehicle} is now in final quality control at Nacho's Legacy. We're checking the repair before delivery.`,
        ready_for_pickup: `Great news, ${firstName}!${vehicle} is ready for pickup at Nacho's Legacy. Contact us if you need to coordinate your pickup time.`,
        delivered: `Thank you, ${firstName}, for trusting Nacho's Legacy. We've marked${vehicle} as delivered. It was a pleasure helping you.`,
      };
  return messages[input.stage];
}
