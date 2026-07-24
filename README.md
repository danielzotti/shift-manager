# Shift Manager

An offline-first Progressive Web Application (PWA) designed for personal work shift management, calendar visualization, cyclic sequence planning, custom shift templates, and smart Google Calendar synchronization.

You can find a demo on [YouTube](https://youtu.be/lHBvA3R5RWI)

---

## 🇬🇧 English Explanation

### What does this app do?

**Shift Manager** is a modern, responsive web application built to help shift workers effortlessly plan, schedule, and sync their work rotation.

Key features include:

- **Cyclic Rotation & Pattern Generator**: Set your custom shift sequence (e.g., Day, Night, Post-Night, Off, Vacation) and auto-fill full months with a single click.
- **Interactive Shift Calendar**: View and manage shifts with custom visual badges, start/end hours, or full-day indicators across Month, Week, Day, and List views.
- **Visual Sync Animations & Smart Event Merging**: Real-time visual progress during Google Calendar synchronization. Consecutive full-day events (e.g. Vacation/Off) are merged into single multi-day events to keep your calendar clean.
- **Google OAuth & Dedicated Calendar Sync**: Isolated Google Calendar integration using custom app metadata (`[APP_ID: shift-manager]`), preventing interference with your primary calendar.
- **Custom Calendar Settings & Deletion Tools**: Easily customize your Google Calendar name, perform date-range or complete shift event cleanup, and backup/restore settings via JSON.
- **Custom Confirm Dialogs & Modern UI**: Replaced generic browser popups with sleek, custom modal components matching the dark glassmorphic design.
- **Public Privacy Policy & Terms of Service Pages**: Fully compliant `/privacy` and `/terms` routes in both English and Italian.
- **Offline-First PWA Support**: Functions seamlessly offline with local storage persistence and PWA installation capability on desktop and mobile devices.
- **Multilingual Support (i18n)**: Full internationalization support with localized UI in English and Italian.

---

## 🇮🇹 Spiegazione in Italiano

### Cosa fa questa applicazione?

**Shift Manager** è una Progressive Web Application (PWA) offline-first concepita per aiutare i lavoratori su turni a pianificare, gestire e sincronizzare la propria rotazione lavorativa in modo semplice e veloce.

Caratteristiche principali:

- **Generatore di Sequenza Ciclica**: Imposta la tua rotazione personalizzata (es. Giorno, Notte, Smontante, Libero, Ferie) e calcola l'intero mese con un solo click.
- **Pianificatore e Calendario Interattivo**: Visualizza e modifica i turni con badge colorati, orari di inizio/fine o indicatori di tutto il giorno nelle viste Mese, Settimana, Giorno e Lista.
- **Animazioni di Sincronizzazione e Accorpamento Smart**: Feedback visivo animato passo-passo durante la sincronizzazione con Google Calendar. I giorni consecutivi di Ferie o Libero vengono accorpati in un unico evento multi-giorno per un calendario sempre ordinato.
- **Autenticazione Google OAuth e Calendario Dedicato**: Integrazione isolata con Google Calendar tramite metadati di tracciamento dell'app (`[APP_ID: shift-manager]`), senza interferire con il tuo calendario principale.
- **Configurazione Calendario e Strumenti di Eliminazione**: Personalizza il nome del calendario Google, effettua pulizie mirate degli eventi per intervallo di date ed esporta/importa il backup della configurazione in JSON.
- **Interfaccia Moderna e Modali Personalizzate**: Modali personalizzate ed eleganti che sostituiscono i dialoghi standard del browser, in perfetto stile scuro e glassmorfico.
- **Pagine Pubbliche Privacy Policy e Termini di Servizio**: Rotte `/privacy` e `/terms` dedicate e multilingua (Italiano ed Inglese).
- **Funzionalità PWA e Offline-First**: Funziona perfettamente anche senza connessione internet grazie al salvataggio locale e alla possibilità di installare l'app su smartphone o desktop.
- **Supporto Multilingua (i18n)**: Interfaccia utente completa con supporto sia per la lingua Italiana che Inglese.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
- **UI & Styling**: React 19, TailwindCSS v4, Lucide Icons, Framer Motion
- **Internationalization**: i18next & react-i18next
- **Integrations**: Google OAuth 2.0 & Google Calendar REST API
- **PWA Integration**: vite-plugin-pwa

---

## 🚀 Getting Started

### Installation & Development

To install dependencies and start the local development server:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3005`.

### Building for Production

To create an optimized production build:

```bash
npm run build
```
