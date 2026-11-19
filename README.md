# Simulador de Energías Marinas (Mareomotriz y Undimotriz)

**Materia:** Energías Renovables I  
**Carrera:** Ingeniería en Energía — Universidad Nacional de San Martín (UNSAM)  
**Fecha de Exposición:** 19/11/2026  
**Regla de Oro Metodológica:** *No inventar datos.* Todo parámetro numérico proviene de fuentes publicadas o está explícitamente etiquetado como un **supuesto ajustable calibrado**.

---

## 1. Objetivo Pedagógico

El simulador demuestra la **brecha entre el potencial teórico del océano y lo que entregan las centrales reales en servicio**, evaluando:
- La cota teórica de potencia media de una cuenca de marea:  
  $$\bar{P}_{\text{teórica}} = 226 \cdot A[\text{km}^2] \cdot a^2[\text{m}] \quad [\text{kW}]$$
- El límite físico de Betz en corrientes de marea:  
  $$C_p \le \frac{16}{27} \approx 0{,}593$$
- El recurso por metro de frente de ola y la relación de captura ($CWR$):  
  $$P_w \approx 0{,}98 \cdot H^2 \cdot T \quad [\text{kW/m}]$$
- Comparación contra factores de planta reales auditados:
  - **La Rance (Francia):** $\approx 26{,}2\,\%$
  - **Sihwa Lake (Corea del Sur):** $\approx 24{,}8\,\%$
  - **MeyGen (Escocia):** $\approx 19{,}0\,\%$
  - **Mutriku (País Vasco):** $\approx 8{,}1\,\%$

---

## 2. Tecnologías y Emplazamientos Modelados

### Marea (Presas y Lagunas)
- **La Rance (Francia):** 240 MW (24 bulbos de 10 MW), doble efecto con bombeo, $A = 17\,\text{km}^2$, $a = 8{,}17\,\text{m}$.
- **Sihwa Lake (Corea):** 254 MW (10 bulbos de 25,4 MW), simple efecto en llenado, $A = 30\,\text{km}^2$.
- **Annapolis (Canadá):** 18 MW (turbina Straflo), $A = 6\,\text{km}^2$, $a = 6{,}4\,\text{m}$.
- **Swansea Bay (Reino Unido):** 320 MW (laguna artificial, proyecto rechazado en 2018).
- **Emplazamientos Patagónicos (Argentina):**
  - *Golfo San José (Chubut):* $5{,}9\,\text{m}$, $778\,\text{km}^2$, $5.040\,\text{MW}$ est., $\bar{P}_{\text{teor}} \approx 6.120\,\text{MW}$.
  - *Golfo Nuevo (Chubut):* $3{,}7\,\text{m}$, $2.376\,\text{km}^2$, $6.570\,\text{MW}$ est., $\bar{P}_{\text{teor}} \approx 7.351\,\text{MW}$.
  - *Río Santa Cruz:* $7{,}5\,\text{m}$, $222\,\text{km}^2$, $2.420\,\text{MW}$ est., $\bar{P}_{\text{teor}} \approx 2.822\,\text{MW}$.
  - *Río Gallegos:* $7{,}5\,\text{m}$, $177\,\text{km}^2$, $1.900\,\text{MW}$ est., $\bar{P}_{\text{teor}} \approx 2.250\,\text{MW}$.
  - *Río Deseado:* $3{,}6\,\text{m}$, $73\,\text{km}^2$, $180\,\text{MW}$ est., $\bar{P}_{\text{teor}} \approx 214\,\text{MW}$.

### Corrientes de Marea
- **MeyGen (Pentland Firth, Escocia):** 4 turbinas de 1,5 MW (6 MW). Flujo medio del estrecho $8{,}97\,\text{GW}$, corrientes de hasta 10 nudos.

### Olas (Undimotriz)
- **Mutriku (País Vasco):** 16 turbinas Wells (296 kW) en rompeolas portuario.
- **LIMPET 500 (Escocia):** 500 kW en acantilado costero.
- **Pelamis (Portugal):** 2,25 MW (atenuador hidráulico articulado).
- **AWS (Portugal):** 2 MW (absorbedor sumergido).
- **CorPower Ocean C4 (Portugal):** Boya de control de fase resonante.
- **Prototipo UTN Mar del Plata (Escollera Norte):** Convenio 2025 PBA/UTN/PROINGED/FREBA (hasta 30 kW por boya; requiere captar $\approx 7\,\text{m}$ de frente de ola para 30 kW a $4{,}3\,\text{kW/m}$).

---

## 3. Modo Exposición y Atajos de Teclado

Diseñado con tipografía de alto contraste para proyector 16:9 y pantalla completa:

| Tecla | Acción |
|---|---|
| `1` | Cargar **La Rance** (Francia) |
| `2` | Cargar **Sihwa Lake** (Corea del Sur) |
| `3` | Cargar **MeyGen** (Escocia) |
| `4` | Cargar **Mutriku** (País Vasco) |
| `5` | Cargar **Golfo San José** (Argentina) |
| `6` | Cargar **Mar del Plata UTN** (Argentina) |
| `C` | Abrir pestaña **Comparar** (Conclusión real vs. simulado) |
| `Espacio` | **Pausar / Reanudar** animación esquemática |
| `F` | Alternar **Modo Exposición / Pantalla completa** |
| `Esc` | Salir del modo exposición |

---

## 4. Instrucciones para Ejecutar

### Opción 1: Acceso rápido con doble clic (Windows)
Doble clic en el archivo `iniciar_simulador.bat`.

### Opción 2: Desde terminal
```bash
npm run dev
```
Abrirá automáticamente en `http://localhost:5173`.

### Ejecutar los tests físicos (Vitest)
```bash
npm test
```
Verifica las 5 pruebas obligatorias:
1. Cota teórica de La Rance ($226 \cdot 17 \cdot 8{,}17^2 \approx 256.000\,\text{kW}$).
2. Potencia de ola regular ($0{,}98 \cdot 2^2 \cdot 8 \approx 31{,}4\,\text{kW/m}$).
3. Rechazo físico de $C_p > 16/27$ (Límite de Betz).
4. La energía de la presa nunca supera la cota teórica.
5. Factores de planta reales coincidentes con los publicados: La Rance $\approx 26\,\%$, Sihwa $\approx 25\,\%$, MeyGen $\approx 19\,\%$, Mutriku $\approx 8\,\%$.

---

## 5. Solución al Bloqueo de OneDrive (`esbuild.exe`)

Las directivas corporativas de sincronización de OneDrive bloquean la subida de ejecutables (`*.exe`), produciendo advertencias con `esbuild.exe`.  
Para resolver esto definitivamente, se configuró una **unión de directorios NTFS (Junction)** que aloja `node_modules` en almacenamiento local (`C:\Users\amusa\dev_storage`), fuera del alcance del motor de sincronización de OneDrive. De este modo, los archivos del repositorio permanecen intactos en el Escritorio sin generar conflictos en la nube.
