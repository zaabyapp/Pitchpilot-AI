# CLAUDE.md — PitchPilot AI

Este archivo es memoria del proyecto. Léelo completo antes de hacer cualquier cambio.

---

## Proyecto

PitchPilot AI es un coach de pitch con IA en tiempo real.
Stack: React 18 (frontend) + Node.js/Express/TypeScript (backend) + Gemini Live API.
Hackathon: Gemini Live Agent Challenge by Google. Deadline: 16 de marzo 2026.

**URLs de producción:**
- Frontend: https://pitchpilot-ai.vercel.app
- Backend: https://pitchpilot-backend-juqzw6zr5a-uc.a.run.app
- Repo: https://github.com/zaabyapp/Pitchpilot-AI

**Paths locales:**
- Proyecto: /Users/donato/Proyectos/PitchPilotAI
- Backend: /Users/donato/Proyectos/PitchPilotAI/backend
- Frontend: /Users/donato/Proyectos/PitchPilotAI/frontend

---

## Modelo Gemini — CRÍTICO

**Modelo actual:** `gemini-2.5-flash-native-audio-preview-12-2025`

NUNCA cambiar el modelo sin confirmación explícita del usuario.
El modelo `gemini-2.0-flash-live-001` NO existe — causó una rotura completa del proyecto cuando se intentó usar.
Cualquier modelo diferente al especificado arriba causará error 1008 al conectar.

---

## Trigger phrases del timer — NUNCA MODIFICAR

Estas frases exactas activan el cronómetro en el frontend. Si se cambian aunque sea una palabra, el timer deja de funcionar:

- EN: `"your 45 seconds start now"`
- ES: `"tus 45 segundos comienzan ahora"`

El frontend detecta estas strings con `includes()`. No agregar puntuación extra, no cambiar capitalización, no parafrasear.

---

## Arquitectura de la sesión de voz

```
Browser mic (PCM 16kHz)
  → frontend WebSocket
    → backend WebSocket proxy (voice.websocket.ts)
      → Gemini Live API WebSocket
        → backend WebSocket proxy
          → frontend playback (PCM 24kHz)
```

El backend actúa como proxy — no procesa audio, solo lo reenvía.
La lógica de fases y eventos ocurre en el backend.
El reporte se genera con Gemini text API (no Live API) al final de la sesión.

---

## Fases de la simulación

```
ONBOARDING → PITCH_LISTENING → QA → COACHING → POST_SIMULATION
```

Eventos del sistema que controlan las fases:
- `<<SYSTEM_EVENT>> session_started` → inicia onboarding
- `<<SYSTEM_EVENT>> pitch_timer_ended` → termina pitch, inicia Q&A
- `<<SYSTEM_EVENT>> qa_complete` → termina Q&A, inicia coaching
- `phase_event: qa_complete` → enviado al frontend para cambiar UI

`qa_complete` se dispara por word count:
- 4 respuestas: siempre
- 3 respuestas: solo si todas tienen ≥30 palabras

---

## Archivos críticos

| Archivo | Qué hace |
|---|---|
| `backend/src/services/voice.websocket.ts` | Todo: proxy Gemini, system prompts, fases, report generation, keepalive |
| `frontend/src/hooks/useVoiceSession.js` | Captura de mic, WebSocket al backend, playback, transcript |
| `frontend/src/hooks/useScreenShare.js` | Screen share, captura de frames JPEG, envío al backend |
| `frontend/src/components/PitchRecorder.jsx` | UI principal, state machine de fases, timers, botones |
| `frontend/src/App.jsx` | Navegación, estado de idioma y modo de sesión |
| `frontend/src/components/FeedbackReport.jsx` | Reporte, exportación PDF |

---

## System prompts

Hay 4 system prompts en `voice.websocket.ts`:
- `SYSTEM_PROMPT_EN` — simulación en inglés
- `SYSTEM_PROMPT_ES` — simulación en español
- `SYSTEM_PROMPT_COACH_EN` — modo coach chat en inglés
- `SYSTEM_PROMPT_COACH_ES` — modo coach chat en español

**Reglas para modificar prompts:**
- EN y ES deben ser funcionalmente idénticos — si agregas una regla en uno, agrégala en el otro
- Nunca usar markdown, negritas ni headers en los prompts — es conversación de voz
- Nunca decirle al agente textualmente qué decir — darle objetivos
- Las reglas contradictorias causan delays de 30-90 segundos en las respuestas

---

## Bugs conocidos y cómo se resolvieron

### 1. Modelo incorrecto causa error 1008
**Síntoma:** App abre sesión, el agente nunca habla, redirige al summary en ~5 segundos.
**Causa:** Modelo cambiado a uno que no existe.
**Fix:** Revertir a `gemini-2.5-flash-native-audio-preview-12-2025`.

### 2. sendReport() en cada cierre de WebSocket
**Síntoma:** Reporte se genera múltiples veces o en momentos incorrectos.
**Causa:** `sendReport()` se llamaba incondicionalmente en el evento `close` de Gemini.
**Fix:** Usar flag `sessionEndRequested` — solo generar reporte si es `true`.

### 3. Agente hace dos preguntas seguidas sin esperar respuesta
**Síntoma:** Después del pitch, el agente hace Q1 y Q2 sin pausa.
**Causa:** Contradicción en el prompt entre "responde inmediatamente" y "espera silencio".
**Fix:** Regla explícita en prompt: secuencia [Q1] → [silencio] → [respuesta] → [Q2].

### 4. Timer de Q&A visible causaba confusión
**Síntoma:** Aparecía un segundo cronómetro de 5 minutos después del pitch.
**Fix:** Eliminado completamente. Solo existe un timer visible: los 45 segundos del pitch.

### 5. Agente reporta tiempo incorrecto del pitch
**Síntoma:** Usuario habla más de 45 segundos, agente dice que tardó menos.
**Causa:** Duration calculada cuando el timer llega a cero, no cuando el usuario termina de hablar.
**Fix:** Trackear `pitchStartTime` y `pitchEndTime` separadamente. `pitchEndTime` se registra cuando el usuario deja de hablar después de la fase de pitch, no cuando el timer termina.

### 6. "Generating Report" se queda trabado
**Síntoma:** Pantalla de reporte nunca termina de cargar.
**Causa:** Llamada a Gemini text API cuelga sin timeout.
**Fix:** `Promise.race()` con timeout de 30 segundos. Si falla, enviar reporte mínimo al frontend para no quedarse trabado.

### 7. Agente dice "cerrando simulación" sin esperar última respuesta
**Síntoma:** Hace la 3ra pregunta e inmediatamente transiciona a coaching.
**Causa:** `qa_complete` se disparaba antes de recibir la respuesta del usuario.
**Fix:** Delay de 2 segundos antes de llamar `injectQaComplete()`.

### 8. Texto de "pensando" aparecía en pantalla
**Síntoma:** Overlay con "Still thinking..." interrumpía la UX visualmente.
**Fix:** Eliminado completamente del UI.

### 9. Agente filtraba su razonamiento interno en la transcripción
**Síntoma:** Aparecía texto como "**Initiating the dialogue...**", "**Formulating the greeting...**" en la transcripción.
**Causa:** Gemini a veces genera texto de planificación antes de hablar.
**Fix:** Filtros en `useVoiceSession.js` que detectan y eliminan estos patrones. Regla en prompt: nunca narrar razonamiento interno.

### 10. Desconexión en respuestas largas del usuario
**Síntoma:** Si el usuario habla más de 30 segundos, el agente se desconecta.
**Causa:** Gemini cierra la conexión por inactividad durante silencios largos del backend.
**Fix:** Keepalive ping cada 20 segundos durante toda la sesión.

### 11. PDF exportaba pantalla negra
**Síntoma:** PDF generado era completamente negro.
**Causa:** html2canvas capturaba el fondo oscuro de la UI.
**Fix:** Div oculto `#pdf-export-content` con fondo blanco, capturar solo ese div.

### 12. Idioma inconsistente en pantallas
**Síntoma:** Al seleccionar español, algunas pantallas seguían en inglés.
**Fix:** Objetos de traducción `t = language === 'es' ? {...} : {...}` en cada componente.

---

## Configuración de VAD (Voice Activity Detection)

Configuración actual en el SETUP message de Gemini:
```typescript
realtimeInputConfig: {
  automaticActivityDetection: {
    disabled: false,
    startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
    endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
    prefixPaddingMs: 200,
    silenceDurationMs: 500,
  }
}
```

Esta configuración DEBE estar en el mensaje SETUP inicial, no después.
Si se mueve fuera del setup, los delays de respuesta vuelven a 30-90 segundos.
`silenceDurationMs: 500` es el valor óptimo — valores más altos causan delays, valores más bajos causan interrupciones falsas.

---

## Deploy

**Backend (Cloud Run):**
```bash
# Docker Desktop debe estar abierto
cd /Users/donato/Proyectos/PitchPilotAI
./deploy.sh
```
- Proyecto GCP: `zaaby-483422`
- Región: `us-central1`
- Servicio: `pitchpilot-backend`
- Imagen debe compilarse con `--platform linux/amd64` (Mac es ARM, Cloud Run es amd64)

**Frontend (Vercel):**
```bash
cd /Users/donato/Proyectos/PitchPilotAI/frontend
npm run build
vercel --prod
```

---

## Variables de entorno requeridas

**Backend (.env):**
```
GEMINI_API_KEY=        ← De Google AI Studio (aistudio.google.com/apikey)
FRONTEND_URL=          ← URL del frontend (localhost:3000 en dev, Vercel en prod)
NODE_ENV=development
```

**Frontend (.env.development):**
```
REACT_APP_BACKEND_URL=http://localhost:3001
```

**Frontend (.env.production):**
```
REACT_APP_BACKEND_URL=https://pitchpilot-backend-juqzw6zr5a-uc.a.run.app
```

---

## Modos de sesión

**Practice Pitch:** Simulación completa con onboarding → pitch → Q&A → coaching → reporte.
**Coach Chat:** Conversación libre con el coach. Sin timers, sin fases de simulación.

El modo se selecciona en la pantalla inicial y se pasa como prop a través de toda la app.

---

## Reglas generales para Claude Code

1. Siempre inspeccionar el código antes de hacer cambios
2. No cambiar el modelo de Gemini
3. No modificar las trigger phrases del timer
4. No mover `realtimeInputConfig` fuera del SETUP message
5. Si modificas un system prompt en EN, hacer el mismo cambio en ES
6. No agregar timeouts que cierren la sesión automáticamente
7. No usar `sendReport()` sin verificar `sessionEndRequested === true`
8. Hacer commit después de cada conjunto de cambios exitosos
9. El timer de 45 segundos es solo visual — no debe interrumpir al usuario ni al agente
10. La sesión debe mantenerse activa indefinidamente hasta que el usuario haga clic en "Terminar"
