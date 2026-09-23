# Supuestos y fuentes del informe

## Horas
- Las horas reales (640) se estiman a partir del alcance instalado: kc_payroll_full 18.0.1.25, payroll_hn, l10n_hn_hr_payroll, kc_biometric_connect, kc_attendance_reports, préstamos, anticipos y solicitudes de horas extra. No provienen de un parte de tiempos auditado.
- Base de producto: 484 h. De ellas, 150 h corresponden a lo cotizado y 334 h a alcance adicional.
- Retrabajo: 156 h, atribuidas a datos sin limpieza, Excel como entrada, turnos informales y relevo de usuarios clave.
- Población: 105 a 120 empleados activos, dos compañías, nómina semanal de planta y quincenal o mensual de administración y ventas.

## Contrato
- Fuente: factura 000-001-01-00000019 (docs/), emitida el 11/05/2025, vencida el 12/05/2025.
- 150 h de consultoría a L 590.00 por hora: L 88,500.00 más ISV 15 %.
- Anticipo aplicado: L 26,550.00 (30 %). Saldo: L 61,950.00 más ISV L 9,292.50 = L 71,242.50.
- Versión cotizada: Odoo 17 Enterprise. Plazo: 9 dic 2024 a 20 ene 2025, aceptación 31 ene 2025.
- La suma de horas asignadas por sección en la factura es 140 h; las 10 h restantes no tienen detalle y se agrupan con el análisis inicial.

## Tipo de cambio
- Referencia por defecto: L 26.88 por USD (BCH, tasa de compra, septiembre 2026). Editable en la página y en assets/js/data.js.

## Falencias de 7 Gatos
- Las seis categorías son tipos de diferencia a validar. Los casos concretos se registran en la página y se exportan a JSON para copiarlos en `falencias7g.casos` de assets/js/data.js.
