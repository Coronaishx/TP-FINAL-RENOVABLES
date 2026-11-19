# Prompt para Antigravity: Simulador de energía mareomotriz y undimotriz

> Copiá todo lo que está debajo de la línea y pegalo en Antigravity como instrucción inicial del proyecto.

---

## 1. Contexto y objetivo

Necesito una aplicación web (simulador) para una exposición oral de 15 minutos en la materia Energías Renovables I (Ingeniería en Energía, UNSAM), el 19/11/2026. El tema es **energía mareomotriz y undimotriz**. El simulador se va a proyectar en vivo en el aula y también lo van a abrir mis compañeros desde el celular con un código QR.

El objetivo pedagógico es mostrar **la distancia entre el potencial teórico del mar y lo que las centrales reales entregan**, usando tecnologías que existen, emplazamientos reales y datos publicados. El simulador tiene que permitir:

1. Elegir un **emplazamiento real** en un mapa (mundo y Argentina).
2. Elegir una **tecnología existente** (presa de marea, laguna, turbina de corriente de marea, columna de agua oscilante, absorbedor puntual, atenuador, rebose).
3. Ver la **simulación animada** y los resultados: potencia en el tiempo, energía anual, factor de planta.
4. Comparar **simulado contra real** en las centrales que existen (La Rance, Sihwa, MeyGen, Mutriku).
5. Consultar para cada sitio una ficha de **marco regulatorio** y de **impacto ambiental**.

### Regla de oro: no inventar datos

- Todo valor numérico que la app muestre por defecto tiene que venir del archivo de datos (sección 6) con su campo `fuente`.
- Si un parámetro físico no tiene fuente (por ejemplo, rendimiento de una turbina o ancho de captura de un dispositivo), se carga como **"supuesto ajustable"**: se muestra con una etiqueta visible (por ejemplo, un chip gris que diga "supuesto") y un tooltip que lo explique. Esos supuestos se calibran para que el preset reproduzca la producción real publicada, y la app lo dice explícitamente ("parámetro calibrado para reproducir 550 GWh/año").
- No agregues centrales, proyectos, cifras ni leyes que no estén en este prompt. Si te falta un dato, dejá el campo vacío y mostrá "sin dato".

## 2. Stack técnico

- **Vite + React + TypeScript.** Estilos con CSS Modules o Tailwind (lo que prefieras, pero coherente en todo el proyecto).
- **Gráficos:** Recharts.
- **Mapa:** `d3-geo` + `world-atlas` (TopoJSON 110m) **empaquetado localmente**. La app tiene que funcionar **sin internet** (en el aula puede no haber wifi). Nada de tiles online ni CDNs en tiempo de ejecución.
- **Estado:** Zustand o React Context.
- **Tests:** Vitest para el motor físico (sección 4.5).
- Salida: sitio estático (`npm run build`) que se pueda publicar en GitHub Pages o Netlify, y que también abra con doble clic desde una carpeta local.
- Responsive: tiene que verse bien en un proyector 16:9 (1920×1080) y en un celular vertical.

## 3. Estructura de pantallas

### 3.1. Barra superior
Título "Simulador de energías marinas", selector de idioma no hace falta (todo en español), botón **"Modo exposición"** (sección 5), botón "Acerca de / fuentes".

### 3.2. Pantalla principal (tres zonas)

1. **Mapa (izquierda, 40 %)**: mapamundi con marcadores de los emplazamientos de la sección 6. Color del marcador por recurso (marea / corriente de marea / olas). Botón para hacer zoom a la costa argentina. Al hacer clic en un marcador se cargan sus parámetros.
2. **Panel de parámetros (centro, 25 %)**: depende de la tecnología. Sliders y campos numéricos con unidades, cada uno con su fuente o la etiqueta "supuesto". Botón "Restablecer valores del sitio".
3. **Resultados (derecha, 35 %)**:
   - Animación esquemática (sección 3.3).
   - Gráfico temporal (niveles y potencia, o velocidad y potencia, o altura de ola y potencia).
   - Tarjetas de resultados: energía anual (GWh/año o MWh/año), potencia media, factor de planta, horas de generación por día y, para presas, relación entre la potencia media simulada y la cota teórica `226·A·a²`.
   - Si el sitio tiene producción real publicada, una barra doble **"simulado vs real"** con la diferencia en %.

### 3.3. Animaciones (SVG, simples y claras)

- **Presa de marea:** corte transversal con el mar a un lado, el embalse al otro, el dique con turbina y compuerta. Los niveles suben y bajan según la simulación; la turbina gira cuando genera; flechas indican el sentido del flujo. Un reloj muestra la hora simulada.
- **Corriente de marea:** rotor que gira con velocidad proporcional a la de la corriente; flechas que cambian de sentido con el flujo y el reflujo.
- **Columna de agua oscilante:** cámara con nivel de agua oscilando, flechas de aire entrando y saliendo y una turbina Wells que **siempre gira en el mismo sentido**.
- **Absorbedor puntual / atenuador / rebose:** esquemas simples con la ola sinusoidal animada y el dispositivo moviéndose.

Control de velocidad de la animación (×1 h/s, ×6 h/s, ×1 día/s) y botón de pausa.

### 3.4. Pestaña "Comparar"
Tabla y gráfico de barras con los presets que tienen datos reales: factor de planta real (calculado con los datos de la sección 6) vs simulado. Esta pestaña es la conclusión de la exposición, así que tiene que ser muy legible.

### 3.5. Pestaña "Argentina"
Mapa de la costa con los sitios de la sección 6.3. Tabla con amplitud, superficie, potencia estimada, producción estimada y potencia media teórica según `226·A·a²`. Al hacer clic en un sitio, se abre en el simulador de presa con esos datos.

### 3.6. Ficha del sitio (panel desplegable)
Para cada emplazamiento: descripción breve, datos técnicos, **marco regulatorio** (sección 6.5), **impacto ambiental** (sección 6.6) y la lista de fuentes.

## 4. Motor físico

Implementar en un módulo aparte (`src/engine/`), sin dependencias de React, con funciones puras y unidades SI internas. Paso de tiempo `dt = 60 s`. Se simulan 29,5 días (un ciclo completo de vivas y muertas) y se anualiza multiplicando por 365/29,5. Constantes: `ρ = 1025 kg/m³`, `g = 9,81 m/s²`.

### 4.1. Marea
- Período semidiurno lunar: `T_M2 = 12,42 h`.
- Ciclo de vivas y muertas: `T_sn = 14,77 días`.
- Nivel del mar: `η(t) = (a(t)/2)·cos(2π·t/T_M2)`, con `a(t) = a_media·(1 + k·cos(2π·t/T_sn))`.
- `a_media` (amplitud media, m) viene del sitio. `k` (modulación vivas/muertas, adimensional) es **supuesto ajustable**, por defecto 0, rango 0–0,5.

### 4.2. Presa de marea y laguna (modelo de embalse concentrado, 0D)
Parámetros: superficie del embalse `A` (km², constante), número de turbinas `N`, potencia nominal por turbina `P_nom`, caudal nominal por turbina `Q_nom` (supuesto), salto mínimo de operación `H_min` (supuesto), salto de arranque `H_start` (supuesto), rendimiento turbina-generador `η_t` (supuesto), área efectiva de compuertas `A_c` (supuesto), coeficiente de descarga `C_d` (supuesto), modo de operación.

En cada paso:
- Salto `H = |η_mar − z_emb|`.
- Caudal por compuertas (si están abiertas): `Q_c = C_d·A_c·√(2·g·H)`, con signo según el sentido.
- Caudal turbinado (si la turbina opera y `H ≥ H_min`): `Q_t = N·Q_nom·√(H/H_nom)`, donde `H_nom` es el salto que da `P_nom` con `Q_nom` y `η_t`. La potencia es `P = ρ·g·Q_t·H·η_t`, limitada a `N·P_nom`.
- Balance del embalse: `dz_emb/dt = ±(Q_t + Q_c)/A`.

Modos de operación (lógica de estados):
1. **Simple efecto, generación en vaciado:** llenado con compuertas abiertas mientras sube la marea; espera con todo cerrado hasta que `H ≥ H_start`; turbinado embalse→mar hasta que `H < H_min`; repetir.
2. **Simple efecto, generación en llenado:** lo inverso (mar→embalse).
3. **Doble efecto:** genera en ambos sentidos; compuertas abiertas brevemente cerca del equilibrio para restablecer niveles.
4. **Doble efecto con bombeo:** como el anterior, y cuando los niveles se igualan cerca de pleamar (o bajamar) las turbinas bombean para elevar (o bajar) el embalse un `ΔZ_bombeo` (supuesto, por defecto 1 m) con rendimiento de bombeo `η_b` (supuesto). La energía consumida se descuenta.

Salidas: series `η_mar(t)`, `z_emb(t)`, `P(t)`; energía neta, potencia media, factor de planta `= P_media / (N·P_nom)`, horas de generación por día y relación `P_media / P_teórica`, con `P_teórica [kW] = 226·A[km²]·a²[m]`.

Mostrar siempre, junto a los resultados, la cota teórica y una explicación de una línea: "la presa nunca puede superar esta potencia media".

**Laguna de marea:** mismo modelo; solo cambia la descripción, la animación (muro artificial cerrado en lugar de dique sobre un estuario) y el preset.

### 4.3. Turbina de corriente de marea
- Velocidad: `v(t) = v_max(t)·|sin(2π·t/T_M2)|`, con `v_max(t)` modulada igual que la amplitud (factor `k`).
- Potencia por turbina: `P = ½·ρ·A_r·C_p·v³·η_tren`, con `A_r = π·D²/4`. Cero si `v < v_arranque`; limitada a `P_nom`.
- Validar que `C_p ≤ 16/27` (límite de Betz); si el usuario pone más, mostrar advertencia y no dejarlo.
- Parámetro **disponibilidad** (%, supuesto): multiplica la energía final.
- Parámetros supuestos: `D`, `C_p`, `η_tren`, `v_arranque`, `v_max`.
- Mostrar el dato de referencia: una corriente de 2 m/s tiene por m² la misma energía que un viento de 18 m/s.

### 4.4. Convertidores de olas
- Recurso: flujo de energía por metro de frente de ola.
  - Ola regular: `P_w = ρ·g²·H²·T/(32π) ≈ 0,98·H²·T` [kW/m].
  - Opción "oleaje irregular": `P_w ≈ 0,49·Hs²·Te` [kW/m] (fórmula de aguas profundas). Mostrar una nota que explique la diferencia entre las dos.
- Potencia eléctrica por unidad: `P_e = min(CWR·P_w·B·η_PTO, P_nom)`, donde `B` es el ancho característico del dispositivo o del frente que ocupa (m), `CWR` es la relación de ancho de captura (adimensional) y `η_PTO` es el rendimiento de la toma de fuerza. Los tres son **supuestos ajustables**.
- Entrada del recurso, dos modos:
  1. **Valor medio anual** (kW/m) del sitio. La app tiene que avisar que usar solo la media no es exacto, porque la potencia no es lineal y está limitada por `P_nom`.
  2. **Tabla de estados de mar** cargada por el usuario (CSV con columnas `H`, `T`, `frecuencia_%`). Se integra la potencia sobre la tabla.
- Para la OWC, la animación muestra la turbina Wells, pero el cálculo es el mismo modelo de ancho de captura.

### 4.5. Tests obligatorios (Vitest)
- `226·17·8,17²` da ≈ 256.000 kW (La Rance, cota teórica).
- `0,98·2²·8` da ≈ 31,4 kW/m.
- `C_p > 16/27` es rechazado.
- La energía de la presa en cualquier modo nunca supera la cota teórica.
- El factor de planta real calculado con los datos del archivo coincide con: La Rance ≈ 26 %, Sihwa ≈ 25 %, MeyGen ≈ 19 %, Mutriku ≈ 8 %.

## 5. Modo exposición
- Pantalla completa, tipografía grande (mínimo 22 px en textos, 48 px en los resultados clave), alto contraste.
- Atajos de teclado: `1` La Rance, `2` Sihwa, `3` MeyGen, `4` Mutriku, `5` Golfo San José, `6` Mar del Plata (prototipo UTN), `C` pestaña Comparar, `Espacio` pausa/reanuda, `F` pantalla completa.
- Botón para exportar el gráfico actual como PNG (para pegarlo en las diapositivas).
- Página "Acerca de" con la lista completa de fuentes y un código QR generado localmente (librería `qrcode`) con la URL publicada.

## 6. Datos (archivo `src/data/sitios.json`)

Cada entrada lleva `id`, `nombre`, `pais`, `lat`, `lon`, `recurso`, `tecnologia`, `parametros` (cada uno con `valor`, `unidad`, `fuente` o `supuesto: true`), `produccion_real` (si existe, con fuente), `ficha_regulatoria`, `ficha_ambiental`.

Las coordenadas de los sitios no figuran en las fuentes: buscalas en un servicio de geocodificación al desarrollar, y marcá en el JSON `"fuente_coord": "geocodificación"`.

### 6.1. Centrales de marea con datos reales

| Sitio | Datos | Fuente |
|---|---|---|
| La Rance (Francia), presa, desde 1966 | 240 MW; 24 grupos bulbo de 10 MW; doble efecto con bombeo; embalse 17 km²; amplitud media 8,17 m (máx. 13,5 m); dique de 700 m; producción neta ≈ 550 GWh/año | Fernández Díez (s.f.) |
| Sihwa (Corea del Sur), presa, desde 2011 | 254 MW; 10 bulbos de 25,4 MW; simple efecto en llenado; embalse 30 km²; dique de 12,5 km (construido en 1994 para control de inundaciones); 552,7 GWh/año; evita ≈ 315.000 t CO₂/año | Carreras (2015) |
| Annapolis (Canadá), presa, desde 1984 | ≈ 18 MW; turbina Straflo; embalse 6 km²; amplitud 6,4 m | Fernández Díez (s.f.) |
| MeyGen (Pentland Firth, Escocia), corriente de marea, desde 2018 | 4 turbinas de 1,5 MW (6 MW); 10 GWh en 2024; > 70 GWh acumulados; 86 MW autorizados. Flujo medio de energía del estrecho ≈ 8,97 GW; corrientes de ≈ 10 nudos | REN21 (2025); Quintero González y Quintero González (2015) |

### 6.2. Proyectos y dispositivos de olas

| Sitio | Datos | Fuente |
|---|---|---|
| Swansea Bay (Reino Unido), laguna de marea, **proyecto rechazado** | 320 MW; muro de 9,5 km; 16 turbinas bidireccionales de 7,2 m; £1.300 millones; factor de carga previsto 19 %. Rechazado por el gobierno británico el 25/06/2018 (aportaría 0,15 % de la electricidad anual; costo por unidad de energía 3 veces el de Hinkley Point C) | Tidal Lagoon Power (2019); Clark (2018) |
| Mutriku (País Vasco), OWC en rompeolas | 16 turbinas Wells de 18,5 kW (296 kW); rompeolas de 440 m; 210 MWh en 2024 | Carreras (2015); REN21 (2025) |
| LIMPET (Islay, Escocia), OWC en costa | 500 kW (2 turbinas Wells de 250 kW); desde 2000 | Carreras (2015) |
| Pelamis (Aguçadoura, Portugal), atenuador | 3 × 750 kW = 2,25 MW; 120 m de largo; granja en 2008, retirada ese año | Carreras (2015) |
| AWS (Póvoa de Varzim, Portugal), absorbedor puntual sumergido | 2 MW; piloto en 2004 | Carreras (2015) |
| CorPower C4 (Aguçadoura, Portugal) | Instalado en 2024; conjunto conectado a la red previsto desde 2026. Potencia: sin dato | REN21 (2025) |

### 6.3. Argentina: emplazamientos de marea

| Sitio | Amplitud media (m) | Superficie (km²) | Potencia estimada (MW) | Producción (GWh/año) | Fuente |
|---|---|---|---|---|---|
| Golfo San José | 5,9 | 778 | 5.040 | 9.400 | Fernández Díez (s.f.) |
| Golfo Nuevo | 3,7 | 2.376 | 6.570 | 16.800 | Fernández Díez (s.f.); Multon (2012) en Carreras (2015) |
| Río Santa Cruz | 7,5 | 222 | 2.420 | sin dato | Fernández Díez (s.f.) |
| Río Gallegos | 7,5 | 177 | 1.900 | 4.800 | Fernández Díez (s.f.); Multon (2012) en Carreras (2015) |
| Río Deseado | 3,6 | 73 | 180 | sin dato | Fernández Díez (s.f.) |

Notas para la ficha de Península Valdés: el istmo Carlos Ameghino (5 a 7 km de ancho) separa los golfos San José y Nuevo; la marea llega con unas 5 h de desfase; las propuestas estimaron del orden de 20 GW y, en otra variante, unos 8 GW; no se concretaron por costo e impacto sobre una zona de cría de ballenas (Fernández Díez, s.f.; Carreras, 2015). Además: memorando ENARSA–RusHydro para estuarios de Santa Cruz, Gallegos y Deseado (≈ 1.000 MW en conjunto); boyas de medición de Y-TEC y UTN en el río Gallegos y el estrecho de Magallanes; INVAP desarrolla una turbina hidrocinética (GEMA, 2014, en Carreras, 2015).

### 6.4. Argentina: recurso de olas y prototipo
- Medias anuales de la costa bonaerense: 2,3 kW/m (Mar de Ajó) a 7,5 kW/m (Puerto Quequén); 4,3 kW/m en Mar del Plata; máximos de hasta 69 kW/m en Punta Médanos (Lanfredi et al., 1992, en Carreras, 2015).
- **Prototipo UTN – Mar del Plata (escollera norte):** convenio de octubre de 2025 entre la Provincia de Buenos Aires, UTN, PROINGED y FREBA; sistema de boyas y brazos que convierte el movimiento vertical en rotación; hasta 30 kW por unidad; 100 unidades podrían abastecer a unos 5.000 hogares (Provincia de Buenos Aires, 2025). Patente del grupo y ensayos a escala 1:20 y 1:10 en el INA (Carreras, 2015).
- En este preset, la app tiene que mostrar el cálculo: con 4,3 kW/m, una unidad de 30 kW debería captar toda la energía de unos 7 m de frente de ola para llegar a su potencia nominal.

### 6.5. Fichas regulatorias (texto breve, con fuente)
- **Argentina:** la Ley 26.190 (2006, art. 4) reconoce como fuentes renovables a la energía mareomotriz, la undimotriz y la de las corrientes marinas. La Ley 27.191 (2015) amplía el régimen y fija metas de participación renovable en el consumo eléctrico (8 % a 2017 y 20 % a 2025) y crea el fondo FODER. Los proyectos requieren Evaluación de Impacto Ambiental según la Ley General del Ambiente 25.675. Mostrar como conclusión de la ficha: "La ley las reconoce, pero no existe un instrumento específico de promoción para energías marinas".
- **Reino Unido:** subastas de Contratos por Diferencia con un cupo reservado para corrientes de marea. En la ronda AR6 (3/9/2024) se adjudicaron 28 MW, con un presupuesto reservado de £15 millones y un precio de ejercicio de £172/MWh (EMEC, 2024). Swansea Bay fue rechazado en 2018 por su costo frente a otras alternativas (Clark, 2018).
- **Unión Europea:** la Estrategia de Energías Renovables Marinas (Comisión Europea, 2020) fija como objetivo al menos 1 GW de energía oceánica a 2030 y 40 GW a 2050.
- **Francia y Corea del Sur:** "sin datos cargados".

### 6.6. Fichas ambientales
- **Presas y lagunas:** reducción de marismas y alimento para aves migratorias; cambios en salinidad, turbidez y sedimentos; dispersión de bacterias fecales; barrera para la migración de peces y mamíferos y riesgo de colisión con turbinas. En La Rance desaparecieron algunas especies durante la construcción y luego colonizaron otras. Efectos positivos: control de inundaciones, uso del dique como camino y, en Sihwa, mejora de la calidad del agua. Emisiones de ciclo de vida de la mareomotriz: ≈ 42 g C/kWh, frente a 180 del gas natural y 270 del carbón (Cátedra ER1, 2026; Quintero González y Quintero González, 2015; Carreras, 2015).
- **Corrientes y olas:** efecto arrecife (más biodiversidad, pero incrustaciones que encarecen el mantenimiento); remoción de sedimentos en la instalación; posibles derrames de fluidos hidráulicos; mayor riesgo de colisión en turbinas de corriente; conflictos con pesca y navegación; ruido de las OWC; reducción de altura de ola limitada a 1–2 km detrás del dispositivo; posible protección contra la erosión costera (Carreras, 2015).

## 7. Fuentes (mostrar completas en "Acerca de")

- Carreras, G. A. (2015). *Energías renovables marinas. Una alternativa sustentable para contribuir a la satisfacción de las futuras demandas energéticas*. UTN, Unidad Académica Mar del Plata.
- Cátedra de Energías Renovables I (2026). *Clase 01*. UNSAM.
- Clark, G. (2018). *Proposed Swansea Bay tidal lagoon*. Gobierno del Reino Unido. https://www.gov.uk/government/speeches/proposed-swansea-bay-tidal-lagoon
- Comisión Europea (2020). *Estrategia de la UE para aprovechar el potencial de las energías renovables marinas* (COM(2020) 741).
- EMEC (2024). *Six tidal stream projects successful in the UK's latest renewable auctions*. https://www.emec.org.uk/six-tidal-stream-projects-successful-in-the-uks-latest-renewable-auctions/
- Fernández Díez, P. (s.f.). *Energía maremotriz*. Universidad de Cantabria.
- Ley N.° 26.190 (2006), Ley N.° 27.191 (2015) y Ley N.° 25.675 (2002). República Argentina.
- Provincia de Buenos Aires (2025). *La Provincia desarrolla el primer dispositivo de energía undimotriz del país*.
- Quintero González, J. R. y Quintero González, L. E. (2015). Energía mareomotriz: potencial energético y medio ambiente. *Gestión y Ambiente, 18*(2), 121–134.
- REN21 (2025). *Renewables 2025 Global Status Report: Ocean power*. https://www.ren21.net/gsr-2025/technologies/ocean-power/
- Tidal Lagoon Power (2019). *Swansea Bay*.

## 8. Diseño visual

- Fondo claro, tipografía sans serif legible (por ejemplo Inter o Source Sans, **empaquetada localmente**).
- Paleta: un azul para marea, un verde azulado para corrientes y un naranja para olas, usados de forma consistente en el mapa, los gráficos y los botones. Nada de fondos oscuros con fotos de olas.
- Gráficos con ejes rotulados y unidades, sin decoración innecesaria.
- Todo el texto de la interfaz en español rioplatense neutro y con números en formato argentino (coma decimal, punto de miles).

## 9. Orden de trabajo sugerido

1. Motor físico + tests (sección 4).
2. Archivo de datos (sección 6) y validación de que cada número tiene fuente o etiqueta de supuesto.
3. Pantalla principal con el preset de La Rance funcionando de punta a punta.
4. Calibrar los supuestos de cada preset para que reproduzca su producción real, y documentar los valores calibrados en el JSON.
5. Resto de tecnologías, mapa, pestañas Comparar y Argentina.
6. Modo exposición, exportar PNG, QR, build estático.
7. Revisión final: abrir sin internet, probar en celular y en 1920×1080.
