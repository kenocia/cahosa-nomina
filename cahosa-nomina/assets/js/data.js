/*
  Datos del informe. Todo lo que cambie de cifras se edita aquí, no en app.js.
  Montos en Lempiras (HNL) sin ISV salvo donde se indica.
*/
window.REPORT = {
  meta: {
    cliente: "CAHOSA y Distribuidora 7 Gatos",
    fechaInforme: "2026-09-22",
    plataforma: "Odoo 18 Enterprise"
  },

  /* Tipo de cambio de referencia: BCH, tasa de compra de inicios de septiembre de 2026. Editable en la página. */
  fx: { valor: 26.88, fuente: "BCH, tasa de compra, septiembre 2026" },

  /* Tarifa de referencia usada en el análisis de horas (USD por hora) */
  tarifaRefUSD: 15,

  contrato: {
    factura: "000-001-01-00000019",
    emisor: "Inversiones Belcam (Kenocia)",
    cliente: "Calzados de Honduras S.A.",
    ordenCompra: "S00020",
    emision: "2025-05-11",
    vencimiento: "2025-05-12",
    version: "Odoo 17 Enterprise",
    horas: 150,
    tarifaL: 590,
    subtotal: 88500,
    isv: 0.15,
    anticipoBase: 26550,
    saldoBase: 61950,
    saldoISV: 9292.5,
    saldoTotal: 71242.5,
    inicio: "2024-12-09",
    finEstimado: "2025-01-20",
    aceptacion: "2025-01-31",
    usuarios: 15,
    pagos: [
      { pct: 30, hito: "Inicio del proyecto", monto: 30532.5, estado: "pagado" },
      { pct: 20, hito: "Fin de etapa 1: instalación y levantamiento", monto: 20355, estado: "pendiente" },
      { pct: 20, hito: "Fin de etapa 2: desarrollos, migración y capacitación", monto: 20355, estado: "pendiente" },
      { pct: 30, hito: "Fin de etapa 3: salida en vivo y soporte", monto: 30532.5, estado: "pendiente" }
    ]
  },

  /* Hitos reales */
  goLive: "2026-09-01",
  finEstabilizacion: "2026-09-18",

  /* Cotizado vs real, por bloque de trabajo (horas) */
  bloques: [
    { k: "Análisis, levantamiento y configuración inicial", cot: 30, real: 108, nota: "Cotizado: 20 h de análisis más 10 h sin detalle (instalación del servidor). Real: fase 1 con auditoría de expedientes y corte del historial Excel." },
    { k: "Módulos de RRHH y reglas salariales de ley", cot: 100, real: 144, nota: "Cotizado: 45 h de módulos y 55 h de reglas. Real: fase 2 con IHSS, RAP, ISR, 13avo, 14avo, finiquito y dos compañías." },
    { k: "Reportería y boleta de pago", cot: 20, real: 24, nota: "Cotizado: 3 reportes personalizados. Real: boleta, reportes de asistencia y checklist de cierre." },
    { k: "Turnos 24/7, horas extra, biométrico e importador", cot: 0, real: 184, nota: "No cotizado. Rotación día/noche, HE25/50/75, conector ZKTeco e importador semanal." },
    { k: "Pilotos paralelos y control de calidad", cot: 0, real: 108, nota: "El contrato asigna estas pruebas al PMCliente contra el sistema manual de 7 Gatos. Las ejecutó Kenocia." },
    { k: "Capacitación y acompañamiento de salida en vivo", cot: 0, real: 72, nota: "Cotizado solo como capacitación básica dentro del análisis. Real: fase 5 con re-capacitación por relevo." }
  ],

  /* Desglose de horas reales por fase: [actividad, base, retrabajo] */
  fases: [
    { n: 1, t: "Levantamiento, diagnóstico y limpieza", a: [
      ["Mapeo planta, administración y ruta; dos compañías", 20, 0],
      ["Auditoría de 105 a 120 expedientes", 24, 12],
      ["Contratos en sistema: salario, estructura, turno, vigencia", 20, 8],
      ["Corte del historial Excel: qué se carga y qué se archiva", 16, 8]]},
    { n: 2, t: "Parámetros de RRHH, contratos y ley HN", a: [
      ["Estructuras semanal, quincenal y mensual", 20, 0],
      ["IHSS empleado y patrono, tope, automático (/4) y manual", 22, 6],
      ["RAP en el mismo esquema", 14, 2],
      ["ISR por tabla y por monto manual", 16, 4],
      ["13avo, 14avo, provisión 1/52, prestaciones y finiquito STSS", 24, 4],
      ["Anticipos, préstamos (LO), beneficios y asiento multiempresa", 18, 2],
      ["Parámetros por compañía (CAHOSA y 7 Gatos)", 12, 0]]},
    { n: 3, t: "Turnos 24/7, horas extra e importador", a: [
      ["Rotación, asignación diaria e historial de horario", 40, 8],
      ["Motor HE25, HE50 y HE75; 44 h día, 36 h noche, sábado, domingo y feriado", 48, 16],
      ["Marcas incompletas, tardanza y cumplimiento", 16, 8],
      ["Importador semanal de Excel", 16, 12],
      ["Conector ZKTeco (construido; adopción en línea no concretada)", 20, 0],
      ["Boleta de pago, reportes de asistencia y checklist de cierre", 20, 4]]},
    { n: 4, t: "Piloto semanal y quincenal, control de calidad", a: [
      ["Dos a tres cierres semanales en paralelo con la hoja", 24, 12],
      ["Piloto quincenal y mensual de administración y ventas", 16, 4],
      ["Casos borde: doble turno, incapacidad IHSS, marca parcial, séptimo día", 22, 6],
      ["Ajustes para igualar diferencias contra el Excel del cliente", 8, 16]]},
    { n: 5, t: "Capacitación, acompañamiento y salida en vivo", a: [
      ["Sesiones a RRHH de planta y de administración", 16, 0],
      ["Manual de cierre y checklist operativo", 12, 0],
      ["Acompañamiento de ciclos reales de pago", 20, 8],
      ["Re-capacitación por relevo de usuarios clave", 0, 16]]}
  ],

  /* Falencias de cálculo en 7 Gatos. Estado: 0 por validar, 1 confirmada, 2 descartada */
  falencias7g: {
    categorias: [
      { t: "Empleados sin marcación en el periodo", estado: 0,
        d: "La entrada de trabajo se genera desde el calendario y el recibo paga la jornada completa aunque no exista una sola marca. Si hubo ausencia, no se descuenta.",
        how: "Asistencias agrupadas por empleado y semana de 7 Gatos: empleados con contrato vigente y cero registros." },
      { t: "Marcas incompletas sin corrección registrada", estado: 0,
        d: "Solo entrada o solo salida. Según cómo se cuadró la hoja, la jornada queda en cero o inflada, y Odoo no guarda el motivo del ajuste.",
        how: "Asistencias con salida vacía o duración menor a 1 h o mayor a 14 h en el periodo." },
      { t: "Horas extra y séptimo día sin asistencia que los respalde", estado: 0,
        d: "Se pagan por input manual o por el Excel, no por la regla de turno. El monto puede ser correcto, pero no es demostrable ante un reclamo.",
        how: "Recibos de 7 Gatos con inputs de horas extra y comparar contra horas registradas en asistencias." },
      { t: "Ausencias, permisos e incapacidades fuera de Odoo", estado: 0,
        d: "El permiso se conoce en la hoja pero no existe en Ausencias. No descuenta, no genera el tratamiento IHSS y distorsiona el cálculo de 13avo, 14avo y vacaciones.",
        how: "Cruce del Excel de novedades del periodo contra Ausencias validadas en Odoo." },
      { t: "Deducciones en monto manual en lugar de fórmula", estado: 0,
        d: "IHSS, RAP o ISR con monto fijo heredado. Dos empleados con el mismo salario no siguen la misma regla y el monto no se actualiza al cambiar el salario.",
        how: "Contratos de 7 Gatos con deducción en modo manual y sin fecha de vencimiento del monto." },
      { t: "Empleado procesado en la compañía o estructura incorrecta", estado: 0,
        d: "Un colaborador de 7 Gatos calculado en la estructura o contabilidad de CAHOSA, o al revés. Contamina la nómina y el asiento de ambas sociedades.",
        how: "Recibos donde la compañía del empleado no coincide con la del lote o del asiento contable." }
    ],
    /* Casos concretos: { empleado, periodo, categoria (índice), diferencia (L, + pagado de más / - pagado de menos), nota } */
    casos: []
  }
};
