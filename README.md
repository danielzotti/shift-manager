# Shift Manager

An offline-first Progressive Web Application (PWA) designed for personal work shift management, calendar visualization, custom shift templates, earnings calculations, and Google Calendar export/sync.

---

## 🇬🇧 English Explanation

### What does this app do?

**Shift Manager** is a modern, responsive web application built to help workers effortlessly track, schedule, and analyze their work shifts.

Key features include:
- **Interactive Shift Calendar**: View and manage shifts on a monthly calendar interface with intuitive color-coded shift badges.
- **Customizable Shift Templates**: Create and configure templates for day shifts, night shifts, on-call duty, custom hours, rates, break durations, and color coding.
- **Automated Earnings & Hours Calculation**: Automatically compute total hours worked, overtime, and estimated gross/net earnings based on hourly rates and custom shift parameters.
- **Google Calendar Sync & iCal Export**: Synchronize scheduled shifts directly with Google Calendar or export them to `.ics` files for external calendar applications.
- **Offline-First PWA Support**: Functions seamlessly offline with local storage persistence and PWA installation capability on desktop and mobile devices.
- **Multilingual Support (i18n)**: Full internationalization support with localized UI in English and Italian.

---

## 🇮🇹 Spiegazione in Italiano

### Cosa fa questa applicazione?

**Shift Manager** è una Progressive Web Application (PWA) offline-first concepita per aiutare i lavoratori a gestire, pianificare e analizzare facilmente i propri turni di lavoro.

Caratteristiche principali:
- **Calendario Turni Interattivo**: Visualizza e gestisci i turni su una vista mensile chiara con badge e colori personalizzati.
- **Modelli di Turno Personalizzabili**: Crea modelli per turni diurni, notturni, reperibilità o orari su misura, impostando tariffe orarie, pause e colori identificativi.
- **Calcolo Automatico di Ore e Guadagni**: Calcola in automatico le ore totali lavorate, lo straordinario e i guadagni stimati in base alle tariffe orarie.
- **Sincronizzazione con Google Calendar ed Esportazione iCal**: Sincronizza i turni direttamente con Google Calendar o esportali in formato `.ics` per qualsiasi app di calendario.
- **Funzionalità PWA e Offline-First**: Funziona perfettamente anche senza connessione internet grazie al salvataggio locale e alla possibilità di installare l'app su smartphone o desktop.
- **Supporto Multilingua (i18n)**: Interfaccia utente completa con supporto sia per la lingua Italiana che Inglese.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
- **UI Library**: React 19, TailwindCSS v4, Lucide Icons, Framer Motion
- **Internationalization**: i18next & react-i18next
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

