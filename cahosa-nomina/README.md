<p align="center">
  <img src="assets/img/kenocia-logo.png" alt="Kenocia" width="110">
</p>

<h1 align="center">Informe de cierre de nómina: CAHOSA y 7 Gatos</h1>

<p align="center">
  Informe gerencial interactivo del flujo de Recursos Humanos y Nómina en Odoo 18 Enterprise.<br>
  Kenocia (Kenosis Company), septiembre de 2026.
</p>

---

## Contenido del informe

| Sección | Qué muestra |
|---|---|
| Resumen ejecutivo | Cifras clave, decisiones que se piden a gerencia y cronología del proyecto |
| Personas involucradas | Equipo Kenocia y rotación de responsables de RRHH en CAHOSA |
| Contrato | Lo cotizado (150 h, Odoo 17) frente a lo ejecutado (640 h, Odoo 18) |
| Estándar vs. real | Cinco flujos de Odoo comparados con lo implementado |
| Riesgos | Cuatro malas prácticas y su riesgo para una migración a Odoo 19 |
| 7 Gatos | Falencias de cálculo por marcas no registradas, con registro de casos |
| Horas | Desglose por fase con filtros y orden |
| Valor y saldo | Saldo pendiente de L 71,242.50, calendario de pagos y escenarios de cierre |
| Plan | Siete acciones con checklist y estado |
| Adopción | Tres indicadores con meta editable y condición para migrar |

## Estructura del repositorio

```
kenocia-cahosa-cierre-nomina/
├── index.html                  Página del informe
├── README.md
├── .nojekyll                   Evita el procesamiento Jekyll en GitHub Pages
├── .gitignore
├── .github/
│   └── workflows/
│       └── pages.yml           Publicación automática en GitHub Pages
├── assets/
│   ├── css/
│   │   └── styles.css          Diseño, tema claro/oscuro, impresión
│   ├── js/
│   │   ├── data.js             Todas las cifras editables del informe
│   │   └── app.js              Interactividad
│   └── img/
│       ├── kenocia-logo.png
│       └── favicon.png
└── docs/
    ├── factura-000-001-01-00000019.pdf
    └── supuestos.md            Supuestos, fuentes y criterios de cálculo
```

## Publicar en GitHub Pages

1. Crear el repositorio **privado** y subir el contenido a la rama `main`.
2. En *Settings > Pages*, en *Source*, elegir **GitHub Actions**. El flujo `pages.yml` publica en cada push a `main`.
3. Alternativa sin Actions: *Source > Deploy from a branch*, rama `main`, carpeta `/ (root)`.

> Importante: el informe contiene montos, la factura con RTN y valoraciones sobre el cliente. En cuentas gratuitas, GitHub Pages publica el sitio aunque el repositorio sea privado. Para restringir el acceso se necesita GitHub Enterprise Cloud con visibilidad privada de Pages, o compartir el informe como PDF desde el botón de imprimir.

## Actualizar cifras

Todas las cifras viven en `assets/js/data.js`: contrato, pagos, horas por fase, bloques cotizados, tipo de cambio y falencias de 7 Gatos. `app.js` calcula totales, porcentajes y días de atraso a partir de esos datos.

### Casos de 7 Gatos

1. En la sección 7 Gatos, registrar cada caso con empleado, periodo, tipo y diferencia en lempiras.
2. Pulsar **Exportar casos (JSON)**.
3. Pegar el contenido en `falencias7g.casos` dentro de `assets/js/data.js` y hacer commit. Los casos quedan fijos para todos los que abran el informe.

El seguimiento del plan, los indicadores de adopción y los casos no exportados se guardan solo en el navegador de quien los marca.

## Ver en local

Abrir `index.html` directamente en el navegador, o servirlo:

```bash
python3 -m http.server 8080
```

---

<p align="center"><sub>Kenocia (Kenosis Company) · consultoria@kenocia.com · kenocia.com</sub></p>
