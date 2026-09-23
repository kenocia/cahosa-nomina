(function () {
  "use strict";
  const R = window.REPORT;
  const C = R.contrato;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const store = {
    get(k, d) { try { const v = localStorage.getItem("kc-cahosa-v2-" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("kc-cahosa-v2-" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const fdate = iso => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MESES[m - 1]} ${y}`; };
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2200); }

  /* ---------- Totales derivados ---------- */
  R.fases.forEach(f => { f.b = f.a.reduce((s, x) => s + x[1], 0); f.w = f.a.reduce((s, x) => s + x[2], 0); });
  const BASE = R.fases.reduce((s, f) => s + f.b, 0);          // 484
  const RW = R.fases.reduce((s, f) => s + f.w, 0);            // 156
  const REAL = BASE + RW;                                     // 640
  const QUOTED = C.horas;                                     // 150
  const EXTRA = BASE - QUOTED;                                // 334
  let FX = store.get("fx", R.fx.valor);
  const overdue = days(C.vencimiento, R.meta.fechaInforme);
  $$("[data-days-overdue]").forEach(e => e.textContent = fmt(overdue));

  /* ---------- Tema, impresión, progreso ---------- */
  const root = document.documentElement;
  const savedTheme = store.get("theme", null);
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  else if (matchMedia("(prefers-color-scheme: dark)").matches) root.setAttribute("data-theme", "dark");
  $("#themeBtn").onclick = () => { const t = root.getAttribute("data-theme") === "dark" ? "light" : "dark"; root.setAttribute("data-theme", t); store.set("theme", t); };
  $$("[data-print]").forEach(b => b.onclick = () => window.print());

  const links = $$(".topnav a"); const secs = links.map(a => document.querySelector(a.getAttribute("href")));
  function onScroll() {
    const h = document.documentElement; $("#progress").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%";
    let idx = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 140) idx = i; });
    links.forEach((a, i) => a.classList.toggle("on", i === idx));
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Hero ---------- */
  function meter(unit) {
    const v = h => unit === "h" ? fmt(h) + " h" : unit === "L" ? "L " + fmt(h * C.tarifaL) : fmt(h * C.tarifaL / FX) + " USD";
    $("#meterTotal").innerHTML = unit === "h" ? fmt(REAL) + "<small>horas</small>" : unit === "L" ? fmt(REAL * C.tarifaL) + "<small>lempiras</small>" : fmt(REAL * C.tarifaL / FX) + "<small>USD</small>";
    $("#meterCap").textContent = unit === "h" ? "Esfuerzo real del flujo RRHH y Nómina" : "Valor del esfuerzo real a la tarifa del contrato, sin ISV";
    $("#barQ").textContent = "Cotizado " + v(QUOTED); $("#barB").textContent = "Adicional " + v(EXTRA); $("#barW").textContent = v(RW);
    $("#lgQ").textContent = v(QUOTED); $("#lgB").textContent = v(EXTRA); $("#lgW").textContent = v(RW);
    $("#meterNote").textContent = unit === "h" ? `Retrabajo: ${Math.round(RW / REAL * 100)} % del total. Horas no facturadas: ${EXTRA + RW}.`
      : `Tarifa del contrato L ${fmt(C.tarifaL, 2)} por hora.${unit === "usd" ? ` Tipo de cambio L ${fmt(FX, 2)} por USD.` : ""}`;
  }
  let heroUnit = "h";
  $$(".seg button").forEach(b => b.onclick = () => { $$(".seg button").forEach(x => x.setAttribute("aria-pressed", x === b)); heroUnit = b.dataset.unit; meter(heroUnit); });
  meter("h");
  requestAnimationFrame(() => setTimeout(() => {
    $("#barQ").style.flexBasis = (QUOTED / REAL * 100) + "%"; $("#barB").style.flexBasis = (EXTRA / REAL * 100) + "%"; $("#barW").style.flexBasis = (RW / REAL * 100) + "%";
  }, 250));

  /* ---------- Contrato ---------- */
  const isvC = C.subtotal * C.isv;
  $("#contractKV").innerHTML = [
    ["Factura", C.factura], ["Emisor", C.emisor], ["Cliente", C.cliente], ["Orden de compra", C.ordenCompra],
    ["Versión cotizada", C.version], ["Horas", fmt(C.horas)], ["Tarifa", "L " + fmt(C.tarifaL, 2) + " por hora"],
    ["Subtotal", "L " + fmt(C.subtotal, 2)], ["ISV 15 %", "L " + fmt(isvC, 2)], ["Total del contrato", "L " + fmt(C.subtotal + isvC, 2)],
    ["Plazo", fdate(C.inicio) + " a " + fdate(C.finEstimado)], ["Aceptación final", fdate(C.aceptacion)], ["Licencias Odoo", C.usuarios + " usuarios"]
  ].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");

  const maxB = Math.max(...R.bloques.map(b => Math.max(b.cot, b.real)));
  $("#cmpRows").innerHTML = R.bloques.map(b => `<div class="cmp-row"><div class="nm">${b.k}</div><div class="fx" style="color:${b.real > b.cot ? "var(--rose)" : "var(--aqua)"}">+${b.real - b.cot} h</div>
    <div class="twin"><span class="c" data-w="${b.cot / maxB * 100}" style="width:0" title="Cotizado ${b.cot} h"></span><span class="r" data-w="${b.real / maxB * 100}" style="width:0" title="Real ${b.real} h"></span></div>
    <div class="nt">${b.cot} h cotizadas, ${b.real} h reales. ${b.nota}</div></div>`).join("")
    + `<div class="cmp-row"><div class="nm" style="font-family:var(--display);font-size:1.05rem">Total</div><div class="fx" style="color:var(--rose)">+${REAL - QUOTED} h</div><div class="nt">${QUOTED} h cotizadas, ${REAL} h reales.</div></div>`;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.querySelectorAll("[data-w]").forEach(s => s.style.width = s.dataset.w + "%"); io.unobserve(e.target); } }), { threshold: .2 });
  io.observe($("#cmpRows"));

  const origin = { A: ["Alcance", ""], C: ["Cliente", "hi"], M: ["Mixto", "md"] };
  const dev = [
    ["Versión", C.version, "Entregado en Odoo 18 Enterprise", "A"],
    ["Horas", `${C.horas} h`, `${REAL} h reales: ${BASE} de producto y ${RW} de retrabajo`, "M"],
    ["Plazo", `${fdate(C.inicio)} a ${fdate(C.finEstimado)}, seis semanas`, `Salida en vivo el ${fdate(R.goLive)}, ${fmt(days(C.finEstimado, R.goLive))} días después del fin estimado`, "M"],
    ["Reportes", "3 reportes personalizados", "Boleta PDF y Excel, libro de salarios, finiquito STSS, resumen bancario, reportes de asistencia y checklist de cierre", "A"],
    ["Alcance funcional", "Empleados, Nómina, Reclutamiento, Ausencias, reglas salariales y asientos", "Además rotación 24/7, HE25/50/75, conector ZKTeco, importador, préstamos, anticipos y dos compañías", "A"],
    ["Roles del cliente", "Patrocinador, PMCliente y Usuario Clave", "Cuatro responsables de RRHH en el periodo, sin PMCliente estable", "C"],
    ["Pruebas paralelas", "Lideradas por el PMCliente contra el sistema manual de 7 Gatos", "Ejecutadas por Kenocia (108 h de piloto); falencias de 7 Gatos aún sin conciliar", "C"],
    ["Pagos", "30 / 20 / 20 / 30 por etapa concluida", `Cobrado solo el 30 %; el 70 % está en la factura ${C.factura}, vencida`, "C"]
  ];
  $("#devRows").innerHTML = dev.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="o"><span class="pill ${origin[r[3]][1]}">${origin[r[3]][0]}</span></td></tr>`).join("");

  /* ---------- Flujos ---------- */
  const flows = [
    { k: "Datos maestros y contratos", lv: 3, tipo: "Dato del cliente",
      std: "Empleado, departamento, puesto y contrato con calendario semanal fijo, salario y estructura de nómina. Una o varias compañías con reglas estándar.",
      imp: "Ficha hondureña (l10n_hn_hr, l10n_hn_hr_contract), contrato con bloque de horas extra y turno, pestaña de deducciones (IHSS, RAP, ISR automático o manual) y beneficios (anticipo, 13avo, 14avo, préstamo). Dos razones sociales sobre la misma base.",
      dev: "El estándar asume el expediente completo antes del primer recibo. Aquí el historial llegó en Excel y con contratos no formalizados en el sistema. Cada nómina arrastra prorrateos y montos manuales para cuadrar el pasado." },
    { k: "Control de asistencias", lv: 3, tipo: "Adopción",
      std: "hr.attendance con marcación en vivo (quiosco, aplicación o IoT). La asistencia alimenta las entradas de trabajo y, desde ahí, el recibo.",
      imp: "Importación semanal por Excel en kc_payroll_full. El conector ZKTeco (kc_biometric_connect, puerto 4370, servidor 8082 y cron) está construido pero no es el canal operativo. Marcas solo de entrada o solo de salida se revisan a mano. kc_attendance_reports cubre tardanza, forzar marca y cumplimiento.",
      dev: "El diseño previsto es sincronización automática; la operación real es un cierre semanal en hoja de cálculo. Odoo valida después de que la hoja ya fue editada, así que el sistema no es la fuente de la verdad. En 7 Gatos esto deja cálculos sin marcas que los respalden." },
    { k: "Rotación de turnos 24/7", lv: 3, tipo: "Desarrollo propio",
      std: "resource.calendar por horas semanales. Planning asigna franjas. No hay rotación día/noche ni reclasificación automática de madrugada, sábado, domingo y feriado.",
      imp: "Rotaciones por periodo, asignación diaria, historial de horario y turno, semana de 44 h diurnas o 36 h nocturnas. HE25, HE50 y HE75 según turno y tipo de día, umbral de 10 minutos, política de sábado en contrato y doble turno de fin de semana (marcas SD/SN).",
      dev: "Esta capa es desarrollo propio, no parametrización, y no estaba en el contrato. Cada cambio de turno no registrado en RRHH obliga a una excepción en el cálculo. El historial de versiones del módulo, hasta 18.0.1.25, refleja ese ajuste continuo." },
    { k: "Deducciones y préstamos", lv: 2, tipo: "Mixto",
      std: "Reglas de nómina genéricas e inputs manuales en el recibo. Sin IHSS, RAP ni ISR de Honduras, sin préstamo con cuota ni anticipo de 13avo y 14avo.",
      imp: "IHSS y RAP semanales: cuota mensual entre 4 en automático o monto fijo en manual, con porción empleado y patrono. ISR por tabla o monto manual. Préstamo por hr.loan (regla LO) y anticipo puntual (PRES) con control de doble descuento. Provisión de 13avo y 14avo a 1/52 del ingreso semanal.",
      dev: "La ley cabe en reglas Python, el mecanismo correcto de Odoo. El desvío está en los montos manuales y prorrateos heredados: conviven con la fórmula y hacen que dos empleados con el mismo salario no sigan la misma regla." },
    { k: "Procesamiento de nómina", lv: 2, tipo: "Mixto",
      std: "Un lote por estructura y periodo. Entradas de trabajo desde calendario, ausencias y asistencia. Recibo, contabilización y pago.",
      imp: "Estructuras semanal (planta), quincenal y mensual (administración y ventas). Cierre con checklist, aseguramiento de entradas de trabajo, boleta PDF y Excel, libro de salarios, prestaciones y finiquito STSS, resumen bancario. Incapacidad IHSS como caso propio (días por 34 % del salario diario).",
      dev: "El motor de lotes sí es estándar. El contenido del recibo no: ordinarias, sábado día, sábado noche, extras y séptimo día se arman con lógica local para igualar la hoja que la empresa ya usaba." }
  ];
  const lvName = ["", "Baja", "Media", "Alta"], lvColor = ["", "var(--aqua)", "var(--amber)", "var(--rose)"];
  const tabsEl = $("#flowTabs"), panelsEl = $("#flowPanels");
  flows.forEach((f, i) => {
    const t = document.createElement("button"); t.className = "tab"; t.setAttribute("role", "tab"); t.id = "ft" + i; t.setAttribute("aria-controls", "fp" + i);
    t.setAttribute("aria-selected", i === 0); t.tabIndex = i === 0 ? 0 : -1;
    t.innerHTML = `<span class="lv" style="background:${lvColor[f.lv]}"></span>${f.k}`; tabsEl.appendChild(t);
    const p = document.createElement("div"); p.className = "card flow flow-panel"; p.id = "fp" + i; p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "ft" + i); p.hidden = i !== 0;
    const bars = [1, 2, 3].map(n => `<span class="${n <= f.lv ? "on" : ""}"></span>`).join("");
    p.innerHTML = `<div style="--k:var(--ink-3)"><h4>Estándar Odoo 18 Enterprise</h4><p>${f.std}</p></div>
      <div style="--k:var(--indigo)"><h4>Implementado en CAHOSA y 7 Gatos</h4><p>${f.imp}</p></div>
      <div class="dev" style="--k:var(--amber)"><h4>Desviación y efecto</h4><p>${f.dev}</p></div>
      <div class="flow-foot"><span style="font-weight:600;font-size:.92rem">${f.k}</span>
      <span style="display:flex;align-items:center;gap:12px;font-size:.88rem;color:var(--ink-2)">Nivel de desviación <span class="lvl" aria-label="Nivel ${lvName[f.lv]}">${bars}</span><b>${lvName[f.lv]}</b><span class="pill">${f.tipo}</span></span></div>`;
    panelsEl.appendChild(p);
  });
  function selTab(i) { $$("#flowTabs .tab").forEach((t, j) => { t.setAttribute("aria-selected", j === i); t.tabIndex = j === i ? 0 : -1; }); $$(".flow-panel").forEach((p, j) => p.hidden = j !== i); }
  tabsEl.addEventListener("click", e => { const t = e.target.closest(".tab"); if (t) selTab(+t.id.slice(2)); });
  tabsEl.addEventListener("keydown", e => {
    const ts = $$("#flowTabs .tab"); let i = ts.indexOf(document.activeElement); if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { i = (i + (e.key === "ArrowRight" ? 1 : -1) + ts.length) % ts.length; ts[i].focus(); selTab(i); e.preventDefault(); }
  });

  /* ---------- Riesgos ---------- */
  const risks = [
    { t: "Datos maestros sin limpieza e historial inconsistente", s: "Expedientes, contratos y nóminas históricas fuera del sistema",
      q: "Expedientes desactualizados, contratos que no existen como documento en Odoo y nóminas históricas calculadas fuera del sistema obligan a cargar deducciones prorrateadas a mano. El recibo deja de ser el resultado de una fórmula y pasa a ser un ajuste para que coincida con un Excel anterior.",
      o: "No hay una base única para antigüedad, salario, techo de IHSS o saldo de préstamo. Un finiquito o un reclamo ante la STSS se reconstruye caso por caso. Con dos compañías, un empleado mal asignado contamina la nómina y la contabilización de la sociedad incorrecta.",
      m: "Lo que se migra es el dato, no la intención del Excel. Montos manuales, contratos abiertos a medias y recibos cuadrados a mano se convierten en deuda: hay que decidir qué es legal, qué es corrección y qué se archiva. Mientras esa decisión no se cierre, el proyecto de versión se detiene en datos, no en código." },
    { t: "Dependencia de Excel y resistencia a la marca en tiempo real", s: "El conector ZKTeco existe, el cierre sigue en hoja de cálculo",
      q: "El biométrico ya tiene conector (ZKTeco, cron y asistente de sincronización). El proceso semanal sigue siendo exportar, revisar, modificar la hoja e importarla. La red y el servidor del cliente explican parte del retraso; la preferencia por editar asistencia y deducciones en Excel antes de Odoo es una decisión de control, no una limitación del producto.",
      o: "El cierre depende de una persona y de un archivo. Una marca incompleta se corrige en la hoja y Odoo no guarda el motivo. La boleta puede cuadrar con el Excel y aun así no ser auditable. En 7 Gatos, los cálculos sin marca son hoy la principal fuente de diferencias.",
      m: "El importador, sus columnas y los códigos de input (PRES, LO, overrides de sábado noche, montos manuales de IHSS, RAP e ISR) son un contrato implícito con esa hoja. En Odoo 19 cambian vistas, entradas de trabajo y con frecuencia el modelo de contrato. Mientras la marca no nazca en hr.attendance, cada versión nueva repite la misma integración frágil." },
    { t: "Turnos no estandarizados y cambios de última hora", s: "La planta cambia el turno fuera de RRHH",
      q: "La planta opera 24/7 con rotación día/noche. El sistema registra rotación, asignación diaria e historial, pero la operación cambia el turno fuera de RRHH y el cálculo de extras absorbe la excepción: entrada en madrugada, sábado que pasa a domingo, doble turno, marca parcial.",
      o: "Horas extra, séptimo día y pago nocturno quedan en discusión en cada cierre. Producción y RRHH no comparten el mismo horario vigente. El umbral de 10 minutos, las 44 h diurnas y las 36 h nocturnas solo son defendibles si el turno del día estaba registrado antes de la marca.",
      m: "resource.calendar sigue siendo el ancla estándar; la rotación, el historial y el clasificador SD/SN son modelos propios. Portarlos es viable si cada excepción está tipificada. Si el comportamiento correcto vive en la memoria de quien arma el Excel, no hay regla que trasladar, solo casos sueltos, y se vuelve a pagar el análisis." },
    { t: "Interrupción de la adopción y pérdida de usuarios clave", s: "Cuatro responsables de RRHH durante el proyecto",
      q: "La salida de encargados de RRHH o de sistemas dejó el proyecto en pausa. En este periodo el rol pasó por cuatro personas, la última Claribel Limas. Al retomar, los parámetros ya no coincidían con la práctica, hubo que volver a capacitar y se perdió la razón de ajustes previos.",
      o: "El costo no es solo la re-capacitación. Es reproceso de nóminas ya corridas, desconfianza en el recibo y retorno al Excel como respaldo. El sistema queda instalado y la operación sigue siendo manual. También explica por qué las pruebas paralelas del contrato nunca tuvieron un líder del lado del cliente.",
      m: "Una migración mayor exige un dueño funcional que valide la nómina paralela. Sin ese rol, el corte de versión lo hace la última persona disponible, que hereda excepciones que no documentó. El riesgo es pasar a Odoo 19 con reglas que nadie sabe por qué existen y asistencias nunca conciliadas contra el reloj." }
  ];
  risks.forEach((r, i) => {
    const d = document.createElement("article"); d.className = "card risk"; d.dataset.open = i === 0;
    d.innerHTML = `<button type="button" aria-expanded="${i === 0}" aria-controls="rb${i}">
      <span class="n">${i + 1}</span><span><h3>${r.t}</h3><div class="sub">${r.s}</div></span>
      <span class="pill hi">Severidad alta</span>
      <svg class="chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="risk-body" id="rb${i}">
        <div class="rtabs" role="tablist">
          <button type="button" class="rtab" role="tab" aria-selected="true" data-p="q">Qué pasa</button>
          <button type="button" class="rtab" role="tab" aria-selected="false" data-p="o">Impacto operativo</button>
          <button type="button" class="rtab" role="tab" aria-selected="false" data-p="m">Riesgo en migración a Odoo 19</button>
        </div>
        <div class="rpanel" data-p="q"><p>${r.q}</p></div>
        <div class="rpanel" data-p="o" hidden><p>${r.o}</p></div>
        <div class="rpanel" data-p="m" hidden><p>${r.m}</p></div>
      </div>`;
    const btn = d.querySelector("button");
    btn.onclick = () => { const o = d.dataset.open !== "true"; d.dataset.open = o; btn.setAttribute("aria-expanded", o); };
    d.querySelectorAll(".rtab").forEach(t => t.onclick = () => {
      d.querySelectorAll(".rtab").forEach(x => x.setAttribute("aria-selected", x === t));
      d.querySelectorAll(".rpanel").forEach(p => p.hidden = p.dataset.p !== t.dataset.p);
    });
    $("#risks").appendChild(d);
  });
  addEventListener("beforeprint", () => { $$(".rpanel,.flow-panel").forEach(p => p.hidden = false); $$(".risk").forEach(r => r.dataset.open = true); });
  addEventListener("afterprint", () => {
    selTab(0);
    $$(".risk").forEach(r => { const sel = r.querySelector('.rtab[aria-selected="true"]').dataset.p; r.querySelectorAll(".rpanel").forEach(p => p.hidden = p.dataset.p !== sel); });
  });

  /* ---------- 7 Gatos ---------- */
  const G = R.falencias7g;
  const catState = store.get("g7cat", G.categorias.map(c => c.estado));
  let localCases = store.get("g7casos", []);
  const estNames = ["Por validar", "Confirmada", "Descartada"];
  $("#caseCat").innerHTML = G.categorias.map((c, i) => `<option value="${i}">${c.t}</option>`).join("");
  function drawCats() {
    const all = G.casos.concat(localCases);
    $("#g7Cats").innerHTML = G.categorias.map((c, i) => {
      const n = all.filter(x => +x.categoria === i);
      const sum = n.reduce((s, x) => s + (+x.diferencia || 0), 0);
      return `<article class="card cat" data-s="${catState[i]}"><h3>${c.t}</h3><p>${c.d}</p>
        <div class="how"><b>Cómo detectarlo en Odoo:</b> ${c.how}</div>
        <div class="ft"><span class="muted" style="font-size:.85rem">${n.length} caso${n.length === 1 ? "" : "s"}${n.length ? ", L " + fmt(sum, 2) : ""}</span>
        <select class="sel" data-i="${i}" aria-label="Estado de ${esc(c.t)}">${estNames.map((e, k) => `<option value="${k}" ${k === catState[i] ? "selected" : ""}>${e}</option>`).join("")}</select></div></article>`;
    }).join("");
    $$("#g7Cats select").forEach(s => s.onchange = () => { catState[+s.dataset.i] = +s.value; store.set("g7cat", catState); drawCats(); });
    $("#g7Conf").textContent = catState.filter(s => s === 1).length;
    $("#g7Pend").textContent = catState.filter(s => s === 0).length;
    $("#g7Sum").textContent = "L " + fmt(all.reduce((s, x) => s + (+x.diferencia || 0), 0), 2);
    drawCases();
  }
  function drawCases() {
    const rows = G.casos.map(x => [x, false]).concat(localCases.map((x, i) => [x, true, i]));
    $("#caseRows").innerHTML = rows.length ? rows.map(([x, loc, i]) => `<tr><td>${esc(x.empleado)}</td><td>${esc(x.periodo)}</td><td>${esc(G.categorias[x.categoria] ? G.categorias[x.categoria].t : "")}</td>
      <td class="n" style="color:${x.diferencia >= 0 ? "var(--rose)" : "var(--indigo)"};font-weight:600">${fmt(x.diferencia, 2)}</td><td>${esc(x.nota || "")}</td>
      <td class="no-print">${loc ? `<button class="del" data-i="${i}" aria-label="Eliminar caso">Eliminar</button>` : '<span class="pill">En repositorio</span>'}</td></tr>`).join("")
      : '<tr><td colspan="6" class="empty">Aún no hay casos registrados. Agregue el primero con el formulario de arriba.</td></tr>';
    $$("#caseRows .del").forEach(b => b.onclick = () => { localCases.splice(+b.dataset.i, 1); store.set("g7casos", localCases); drawCats(); toast("Caso eliminado"); });
  }
  $("#caseForm").onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target);
    const c = { empleado: f.get("empleado").trim(), periodo: f.get("periodo").trim(), categoria: +f.get("categoria"), diferencia: +f.get("diferencia"), nota: f.get("nota").trim() };
    localCases.push(c); store.set("g7casos", localCases);
    if (catState[c.categoria] === 0) { catState[c.categoria] = 1; store.set("g7cat", catState); }
    e.target.reset(); drawCats(); toast("Caso agregado");
  };
  function download(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  $("#caseExport").onclick = () => { download("casos-7gatos.json", JSON.stringify(G.casos.concat(localCases), null, 2), "application/json"); toast("Casos exportados en JSON"); };
  $("#caseCsv").onclick = () => {
    const all = G.casos.concat(localCases);
    const csv = ["empleado,periodo,tipo,diferencia_L,nota"].concat(all.map(x => [x.empleado, x.periodo, G.categorias[x.categoria].t, x.diferencia, x.nota || ""].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","))).join("\n");
    download("casos-7gatos.csv", "\ufeff" + csv, "text/csv"); toast("Casos exportados en CSV");
  };
  drawCats();

  /* ---------- Horas ---------- */
  const maxPh = Math.max(...R.fases.map(f => f.b + f.w));
  const st = { phase: 0, mode: "all", sort: "plan", only: false };
  [["Todas", 0]].concat(R.fases.map(f => ["F" + f.n, f.n])).forEach(([l, v]) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "fchip"; b.textContent = l; b.dataset.v = v;
    b.title = v ? R.fases[v - 1].t : "Todas las fases"; b.onclick = () => { st.phase = v; render(); }; $("#phaseChips").appendChild(b);
  });
  $$("#colMode button").forEach(b => b.onclick = () => { st.mode = b.dataset.m; render(); });
  $("#sortSel").onchange = e => { st.sort = e.target.value; render(); };
  $("#onlyRw").onchange = e => { st.only = e.target.checked; render(); };
  R.fases.forEach(f => {
    const b = document.createElement("button"); b.type = "button"; b.className = "prow"; b.dataset.v = f.n;
    b.innerHTML = `<div class="top"><span>${f.n}. ${f.t}</span><span>${f.b + f.w} h</span></div><div class="pbar"><i class="b"></i><i class="w"></i></div>`;
    b.onclick = () => { st.phase = st.phase === f.n ? 0 : f.n; render(); }; $("#phaseBars").appendChild(b);
  });
  const pct = (b, w) => b + w ? Math.round(w / (b + w) * 100) : 0;
  const row = (name, b, w) => { const p = pct(b, w); return `<tr><td>${name}</td><td class="n c-base">${b}</td><td class="n c-rw ${w ? "rw" : ""}">${w}</td><td class="n c-tot"><b>${b + w}</b></td><td class="n">${p} %<span class="mini"><i style="width:${p}%"></i></span></td></tr>`; };
  function render() {
    $$("#phaseChips .fchip").forEach(c => c.setAttribute("aria-pressed", +c.dataset.v === st.phase));
    $$("#colMode button").forEach(c => c.setAttribute("aria-pressed", c.dataset.m === st.mode));
    $$(".prow").forEach(r => {
      const f = R.fases[r.dataset.v - 1]; r.setAttribute("aria-pressed", +r.dataset.v === st.phase);
      r.querySelector(".b").style.width = (st.mode !== "rw" ? f.b / maxPh * 100 : 0) + "%";
      r.querySelector(".w").style.width = (st.mode !== "base" ? f.w / maxPh * 100 : 0) + "%";
      r.querySelector(".top span:last-child").textContent = (st.mode === "base" ? f.b : st.mode === "rw" ? f.w : f.b + f.w) + " h";
    });
    let html = "", TB = 0, TW = 0;
    const list = R.fases.filter(f => !st.phase || f.n === st.phase);
    if (st.sort === "plan") {
      list.forEach(f => {
        const acts = f.a.filter(x => !st.only || x[2] > 0); if (!acts.length) return;
        html += `<tr class="ph"><td colspan="5"><span class="pn">Fase ${f.n}</span>${f.t}</td></tr>`;
        acts.forEach(x => { html += row(x[0], x[1], x[2]); TB += x[1]; TW += x[2]; });
      });
    } else {
      const all = []; list.forEach(f => f.a.forEach(x => { if (!st.only || x[2] > 0) all.push([...x, f.n]); }));
      const key = { rw: x => x[2], tot: x => x[1] + x[2], pct: x => pct(x[1], x[2]) }[st.sort];
      all.sort((a, b) => key(b) - key(a)).forEach(x => { html += row(`<span class="muted" style="font-weight:600;margin-right:6px">F${x[3]}</span>${x[0]}`, x[1], x[2]); TB += x[1]; TW += x[2]; });
    }
    if (!html) html = '<tr><td colspan="5" class="empty">Ninguna actividad cumple el filtro. Quite “Solo actividades con retrabajo” o elija otra fase.</td></tr>';
    else html += `<tr class="tot"><td>${st.phase ? "Subtotal fase " + st.phase : "Total del proyecto"}</td><td class="n c-base">${TB}</td><td class="n c-rw">${TW}</td><td class="n c-tot">${TB + TW}</td><td class="n">${pct(TB, TW)} %</td></tr>`;
    $("#hoursTable tbody").innerHTML = html;
    const hide = (c, h) => $$("#hoursTable ." + c).forEach(e => e.style.display = h ? "none" : "");
    hide("c-base", st.mode === "rw"); hide("c-rw", st.mode === "base"); hide("c-tot", st.mode !== "all");
  }
  render();

  /* ---------- Cartera y valoración ---------- */
  $("#payRows").innerHTML = C.pagos.map(p => `<div class="pay ${p.estado === "pagado" ? "paid" : "due"}"><div class="pc">${p.pct}%</div>
    <div><b>${p.hito}</b><small>${p.estado === "pagado" ? "Pagado como anticipo" : "Etapa concluida, pago exigible"}</small></div>
    <div class="m">L ${fmt(p.monto, 2)}</div></div>`).join("");

  let rateMode = "contract", cur = "L", scenSel = store.get("scen", 0);
  $("#fxIn").value = FX;
  const money = L => cur === "L" ? "L " + fmt(L, 2) : "USD " + fmt(L / FX, 2);
  function valuation() {
    const rL = rateMode === "contract" ? C.tarifaL : R.tarifaRefUSD * FX;
    const rTxt = rateMode === "contract" ? (cur === "L" ? "L " + fmt(C.tarifaL, 2) : "USD " + fmt(C.tarifaL / FX, 2)) : (cur === "L" ? "L " + fmt(rL, 2) : "USD " + fmt(R.tarifaRefUSD, 2));
    const rows = [
      ["Cotizado y facturado", QUOTED, cur === "L" ? "L " + fmt(C.tarifaL, 2) : "USD " + fmt(C.tarifaL / FX, 2), C.subtotal, '<span class="pill md">30 % cobrado, 70 % vencido</span>'],
      ["Alcance adicional no cotizado", EXTRA, rTxt, EXTRA * rL, '<span class="pill hi">No facturado</span>'],
      ["Retrabajo por prácticas del cliente", RW, rTxt, RW * rL, '<span class="pill hi">No facturado</span>']
    ];
    const tot = rows.reduce((s, r) => s + r[3], 0);
    $("#valRows").innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td><td class="n"><b>${money(r[3])}</b></td><td>${r[4]}</td></tr>`).join("")
      + `<tr class="tot"><td>Esfuerzo real</td><td class="n">${REAL}</td><td class="n"></td><td class="n">${money(tot)}</td><td></td></tr>`
      + `<tr><td style="color:var(--rose);font-weight:600">No facturado</td><td class="n">${EXTRA + RW}</td><td class="n"></td><td class="n" style="color:var(--rose);font-weight:700">${money((EXTRA + RW) * rL)}</td><td></td></tr>`;
    $("#valNote").textContent = `La tarifa del contrato, L ${fmt(C.tarifaL, 2)} por hora, equivale a ${fmt(C.tarifaL / FX, 2)} USD por hora con el tipo de cambio de L ${fmt(FX, 2)} (${R.fx.fuente}). La referencia de ${R.tarifaRefUSD} USD por hora que usa el análisis de horas queda por debajo de lo contratado.`;
    const k = 1 + C.isv;
    const sc = [
      ["Solo saldo contractual", C.saldoTotal, "Factura " + C.factura + ". El alcance adicional y el retrabajo quedan como inversión de Kenocia."],
      ["Saldo más retrabajo", C.saldoTotal + RW * rL * k, `Añade las ${RW} h de retrabajo, causadas por la operación del cliente.`],
      ["Saldo más alcance adicional y retrabajo", C.saldoTotal + (EXTRA + RW) * rL * k, `Añade las ${EXTRA + RW} h no facturadas del esfuerzo real.`]
    ];
    $("#scen").innerHTML = sc.map((s, i) => `<button type="button" aria-pressed="${i === scenSel}" data-i="${i}"><b>${s[0]}</b><span class="a">${money(s[1])}</span><small>${s[2]}</small></button>`).join("");
    $$("#scen button").forEach(b => b.onclick = () => { scenSel = +b.dataset.i; store.set("scen", scenSel); valuation(); });
    $("#owedUsd").textContent = `Equivale a USD ${fmt(C.saldoTotal / FX, 2)} al tipo de cambio de L ${fmt(FX, 2)}`;
  }
  $$("#rateMode button").forEach(b => b.onclick = () => { rateMode = b.dataset.r; $$("#rateMode button").forEach(x => x.setAttribute("aria-pressed", x === b)); valuation(); });
  $$("#curMode button").forEach(b => b.onclick = () => { cur = b.dataset.c; $$("#curMode button").forEach(x => x.setAttribute("aria-pressed", x === b)); valuation(); });
  $("#fxIn").onchange = e => { const v = +e.target.value; if (v > 1) { FX = v; store.set("fx", FX); valuation(); meter(heroUnit); toast("Tipo de cambio actualizado"); } else e.target.value = FX; };
  valuation();

  /* ---------- Plan ---------- */
  const recs = [
    { t: "Cerrar el compromiso financiero del contrato", r: "Gerencia de CAHOSA y Kenocia", p: "Inmediato",
      d: `Las tres etapas están concluidas y el proyecto está en producción. El saldo de la factura ${C.factura} es exigible y el alcance adicional debe tener un tratamiento acordado por escrito.`,
      c: [`Pago del saldo de L ${fmt(C.saldoTotal, 2)}`, "Acuerdo sobre alcance adicional y retrabajo", "Acta de aceptación final del proyecto", "Contrato de soporte mensual firmado"] },
    { t: "Conciliar las falencias de cálculo de 7 Gatos", r: "RRHH de 7 Gatos con Kenocia", p: "Próximos dos cierres",
      d: "Revisar las seis categorías de la sección 6, cuantificar cada caso y decidir si se ajusta en la nómina siguiente o se archiva con soporte. Ningún caso se corrige con un input para que cuadre.",
      c: ["Seis categorías revisadas y marcadas", "Casos registrados con su diferencia", "Decisión de ajuste o archivo por caso", "Casos exportados y fijados en el repositorio"] },
    { t: "Cerrar el expediente antes del próximo cierre de nómina", r: "RRHH", p: "4 semanas",
      d: "Un contrato vigente por empleado. Lo que no tenga soporte se archiva; no se prorratea en el siguiente recibo. Sin este corte, la fase de ley sigue en modo manual.",
      c: ["Compañía y estructura (semanal, quincenal o mensual) por empleado", "Salario y turno base registrados en el contrato", "Tipo de IHSS, RAP e ISR: fórmula o monto manual", "Fecha de vencimiento de cada monto manual", "Historial sin soporte archivado, no prorrateado"] },
    { t: "Dejar el Excel como reporte, no como entrada", r: "Sistemas del cliente, RRHH dueño del dato", p: "6 a 8 semanas desde que el reloj sea alcanzable",
      d: "Activar el conector ZKTeco ya instalado sobre una red estable. Basta sincronización nocturna el primer mes. La marca incompleta se corrige en Odoo con motivo, usando forzar marca.",
      c: ["Servidor del reloj alcanzable desde Odoo", "Sincronización nocturna activa, incluido 7 Gatos", "Correcciones con motivo dentro de Odoo", "Dos cierres consecutivos cuadrados sin hoja previa", "Importador semanal apagado"] },
    { t: "El turno del día se registra antes de que el empleado marque", r: "Producción solicita, RRHH aplica", p: "Inmediato",
      d: "Una marca fuera de turno no genera hora extra hasta que exista la asignación. HE25, HE50, HE75, sábado y noche vuelven a ser consecuencia del horario, como calcula Odoo.",
      c: ["Flujo de solicitud de cambio de turno acordado con Producción", "Rotación y asignación diaria actualizadas por RRHH", "Regla comunicada: sin asignación no hay hora extra"] },
    { t: "Una sola vía para cada deducción", r: "RRHH y Contabilidad", p: "Próximo cierre",
      d: "Préstamo solo por hr.loan. Anticipo solo por su documento. IHSS, RAP e ISR en fórmula, con monto manual limitado a un periodo de transición escrito en el contrato. Esto es lo que hace migrable el recibo.",
      c: ["Préstamos solo por hr.loan", "Anticipos solo por su documento", "IHSS, RAP e ISR en fórmula", "Prohibido el input para hacer que cuadre"] },
    { t: "Dueño del proceso y adopción medible", r: "Gerencia de CAHOSA", p: "2 meses de medición",
      d: "Nombrar un responsable de nómina y un respaldo, usando el checklist de cierre que ya existe en el sistema. Si un usuario clave sale, el respaldo y el manual evitan la pausa.",
      c: ["Responsable de nómina nombrado", "Respaldo nombrado y capacitado", "Manual de cierre entregado a ambos", "Tres indicadores medidos cada mes (sección 10)"] }
  ];
  const statusNames = ["Pendiente", "En marcha", "Cumplida"];
  const fresh = () => recs.map(r => ({ s: 0, c: r.c.map(() => false) }));
  let recState = store.get("recs", fresh());
  if (recState.length !== recs.length) recState = fresh();
  function drawRecs() {
    $("#recs").innerHTML = "";
    recs.forEach((r, i) => {
      const s = recState[i];
      const el = document.createElement("article"); el.className = "card rec"; el.dataset.status = s.s;
      el.innerHTML = `<div class="rn">Acción ${i + 1}</div><h3>${r.t}</h3><p>${r.d}</p>
        <dl><dt>Responsable</dt><dd>${r.r}</dd><dt>Plazo</dt><dd>${r.p}</dd></dl>
        <ul class="checks">${r.c.map((c, j) => `<li><label><input type="checkbox" data-j="${j}" ${s.c[j] ? "checked" : ""}><span>${c}</span></label></li>`).join("")}</ul>
        <div class="foot"><span class="muted" style="font-size:.85rem">${s.c.filter(Boolean).length} de ${r.c.length} puntos</span>
        <select class="sel" aria-label="Estado de la acción ${i + 1}">${statusNames.map((n, k) => `<option value="${k}" ${k === s.s ? "selected" : ""}>${n}</option>`).join("")}</select></div>`;
      el.querySelectorAll("input").forEach(inp => inp.onchange = () => {
        s.c[+inp.dataset.j] = inp.checked; const done = s.c.filter(Boolean).length;
        if (done === s.c.length) s.s = 2; else if (done > 0 && s.s === 0) s.s = 1; else if (done < s.c.length && s.s === 2) s.s = 1;
        saveRecs();
      });
      el.querySelector("select").onchange = e => { s.s = +e.target.value; saveRecs(); };
      $("#recs").appendChild(el);
    });
    const done = recState.filter(s => s.s === 2).length;
    $("#pgTxt").textContent = `${done} de ${recs.length} cumplidas`;
    $("#pgBar").style.width = (done / recs.length * 100) + "%";
  }
  function saveRecs() { store.set("recs", recState); drawRecs(); }
  $("#recReset").onclick = () => { recState = fresh(); saveRecs(); toast("Seguimiento reiniciado"); };
  drawRecs();

  /* ---------- Adopción ---------- */
  const kpiDef = [
    { t: "Marcas que entran a Odoo sin pasar por Excel", meta: 95 },
    { t: "Empleados con IHSS, RAP e ISR en fórmula", meta: 100 },
    { t: "Cambios de turno registrados antes de la marca", meta: 90 }
  ];
  const kv = store.get("kpis", kpiDef.map(k => ({ v: 0, m: k.meta })));
  const arc = p => { const a = Math.PI * (1 - p / 100), x = 70 + 60 * Math.cos(a), y = 70 - 60 * Math.sin(a); return `M10 70 A60 60 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`; };
  function drawK() {
    $("#kpis").innerHTML = ""; let ok = 0;
    kpiDef.forEach((k, i) => {
      const s = kv[i], good = s.v >= s.m, near = s.v >= s.m * .7; if (good) ok++;
      const col = good ? "var(--aqua)" : near ? "var(--amber)" : "var(--rose)";
      const el = document.createElement("div"); el.className = "card kpi";
      el.innerHTML = `<h3>${k.t}</h3>
        <div class="gauge"><svg viewBox="0 0 140 76" aria-hidden="true"><path d="M10 70 A60 60 0 0 1 130 70" fill="none" stroke="var(--surface-2)" stroke-width="12" stroke-linecap="round"/>
        ${s.v > 0 ? `<path d="${arc(Math.min(s.v, 100))}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round"/>` : ""}</svg><b>${s.v} %</b></div>
        <div class="in"><label for="kv${i}">Valor medido</label><input type="number" id="kv${i}" min="0" max="100" value="${s.v}">
        <label for="km${i}">Meta</label><input type="number" id="km${i}" min="0" max="100" value="${s.m}"></div>
        <div class="st"><span class="pill ${good ? "ok" : near ? "md" : "hi"}">${good ? "En meta" : near ? "Cerca de la meta" : "Por debajo de la meta"}</span></div>`;
      const clamp = v => Math.max(0, Math.min(100, +v || 0));
      el.querySelector("#kv" + i).onchange = e => { s.v = clamp(e.target.value); store.set("kpis", kv); drawK(); };
      el.querySelector("#km" + i).onchange = e => { s.m = clamp(e.target.value); store.set("kpis", kv); drawK(); };
      $("#kpis").appendChild(el);
    });
    $("#ready").classList.toggle("go", ok === 3);
    $("#readyT").textContent = ok === 3 ? "Condición cumplida para agendar la migración" : "Aún no es momento de migrar a Odoo 19";
    $("#readyP").textContent = ok === 3 ? "Los tres indicadores están en meta. Confirme que se sostienen durante dos meses antes de fijar la fecha; así se migra el proceso y no la excepción."
      : `${ok} de 3 indicadores en meta. Migrar antes traslada la excepción, no el proceso.`;
  }
  drawK();
})();
