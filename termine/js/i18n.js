'use strict';

const translations = {
  de: {
    'page.title': 'Wie funktioniert das? — Erfindergeist Jülich',
    'skip.link': 'Zum Hauptinhalt springen',

    'nav.architecture': 'Technischer Aufbau',
    'nav.events': 'Termine',
    'nav.ics': 'ICS Kalender',
    'nav.plugin': 'WordPress Plugin',
    'nav.downloads': 'PDF',
    'nav.homeassistant': 'Home Assistant',
    'nav.toggle.dark': 'Dunkles Design aktivieren',
    'nav.toggle.light': 'Helles Design aktivieren',
    'nav.toggle.lang': 'Switch to English',

    'hero.title': 'Wie funktioniert das?',
    'hero.subtitle': 'Lerne alles über:',
    'hero.description': 'Entdecke den technischen Aufbau hinter den Terminen des Erfindergeist Jülich e.V. — von NextCloud über das WordPress-Plugin bis zu PDF-Dateien und Smart-Home-Automationen.',

    'events.title':        'Kommende Termine',
    'events.subtitle':     'Die nächsten Veranstaltungen auf einen Blick',
    'events.loading':      'Termine werden geladen…',
    'events.error':        'Termine konnten nicht geladen werden.',
    'events.empty':        'Aktuell keine kommenden Termine gefunden.',
    'events.website.hint': 'Alle Termine findest du auch auf unserer Website:',
    'events.website.link': 'erfindergeist.org/veranstaltungen',

    'arch.title': 'Technischer Aufbau',
    'arch.subtitle': 'So reisen deine Termine durch das Internet',
    'arch.description': 'Alles beginnt in der Cloud und landet am Ende als PDF in deiner Hand oder als Erinnerung auf deinem Smartphone.',
    'arch.node.nextcloud': 'NextCloud',
    'arch.node.wordpress': 'WordPress + Plugin',
    'arch.node.github': 'GitHub pdf-termine',
    'arch.node.events': '/events JSON',
    'arch.node.ics': '/ics Kalender',
    'arch.node.pdf': 'PDF Dateien',
    'arch.node.share': 'Share Server',
    'arch.legend.data': 'Datenfluss',
    'arch.legend.pdf': 'PDF Erzeugung',
    'arch.onesource.title':    'Eine Quelle — viele Empfänger',
    'arch.onesource.text':     'Alle unsere Systeme nutzen dieselben Termine aus NextCloud — jedes bekommt die Daten in genau dem Format, das es braucht.',
    'arch.onesource.site':     'Diese Erklär-Seite',
    'arch.onesource.homepage': 'Unsere Homepage',
    'arch.onesource.pdf':      'PDF Erzeugung',
    'arch.onesource.cal':      'Persönliche Kalender',
    'arch.onesource.yours':    'Dein Projekt?',
    'arch.help.text': 'Wir unterstützen Privatpersonen und Vereine gerne bei technischen Lösungen — egal ob Website, Automatisierung oder eigene Softwareprojekte. Sprich uns einfach an!',
    'arch.help.contact': 'Kontakt aufnehmen',

    'ics.title': 'Was ist ICS?',
    'ics.subtitle': 'Der Stundenplan für deinen Computer',
    'ics.description': 'Eine ICS-Datei ist wie ein digitaler Stundenplan. Dein Kalender-Programm (z.B. Google Kalender, Apple Kalender oder Outlook) kann diese Datei lesen und alle Termine automatisch eintragen.',
    'ics.analogy': 'Stell dir vor, du hast einen Zettel mit allen Terminen — ICS ist genau das, aber für Computer! Jedes Programm kann es lesen.',
    'ics.autoupdate': 'Einmal abonnieren, immer aktuell: Wenn du unsere ICS-Datei in Google Kalender, Outlook oder Apple Kalender einbindest, werden neue und geänderte Termine automatisch übernommen — ganz ohne erneuten Import!',
    'ics.link.label':  'Unsere ICS-Datei ansehen',
    'ics.copy.label':  'ICS-Link kopieren',
    'ics.toast.text':  'ICS-Link in Zwischenablage kopiert!',
    'ics.example.title': 'So sieht eine ICS-Datei aus:',

    'plugin.title': 'Das WordPress Plugin',
    'plugin.subtitle': 'Die Brücke zwischen Cloud und Website',
    'plugin.description': 'Das selbst entwickelte WordPress-Plugin holt die Termine aus der NextCloud, speichert sie zwischen (Caching) und stellt sie als moderne Web-API zur Verfügung.',
    'plugin.caching.label': 'Warum Caching?',
    'plugin.caching.desc': 'Statt bei jeder Anfrage die NextCloud zu befragen, speichert das Plugin die Daten kurz zwischen. Das ist schneller und schont den Server.',
    'plugin.endpoints.title': 'Diese Endpunkte stehen zur Verfügung:',
    'plugin.github.label': 'Plugin auf GitHub ansehen',
    'plugin.endpoint.events.desc': 'Alle Termine als JSON',
    'plugin.endpoint.tomorrow.desc': 'Nur die Termine von morgen',
    'plugin.endpoint.tomorrow.hint': 'Hinweis: Der /tomorrow-Endpunkt gibt nur dann Daten zurück, wenn morgen tatsächlich ein Termin stattfindet. Ist nichts geplant, bleibt die Antwort leer.',
    'plugin.open.label': 'Offen für alle',
    'plugin.open.desc':  'Alle Endpunkte sind öffentlich erreichbar und ohne Anmeldung nutzbar. Du darfst sie gerne für dein eigenes privates Projekt verwenden — ob Smart-Home, App oder Website.',

    'pdf.title': 'PDF Generator',
    'pdf.subtitle': 'Automatisch schöne PDFs erstellen',
    'pdf.description': 'Das GitHub-Repository pdf-termine erstellt automatisch Terminübersichten als PDF-Dateien und lädt sie auf den Share-Server hoch — vollständig automatisiert mit GitHub Actions.',
    'pdf.step1': 'GitHub Actions startet automatisch',
    'pdf.step2': 'Termine werden abgerufen',
    'pdf.step3': 'PDF wird erstellt',
    'pdf.step4': 'Auf Share hochgeladen',
    'pdf.schedule': 'Die PDFs werden automatisch jeden Montag um 3:00 Uhr morgens neu generiert — so sind sie immer auf dem neuesten Stand.',
    'pdf.github.label': 'pdf-termine auf GitHub',
    'pdf.share.label':  'share.erfindergeist.org',
    'pdf.vc.title':       'Versionskontrolle mit GitHub',
    'pdf.vc.text':        'GitHub speichert jede Änderung am Code mit Zeitstempel — so ist immer nachvollziehbar, was wann geändert wurde, und ältere Versionen lassen sich jederzeit wiederherstellen.',
    'pdf.workflow.title': 'Automatische Workflows mit GitHub Actions',
    'pdf.workflow.text':  'GitHub Actions führt Aufgaben automatisch aus, sobald eine Änderung hochgeladen wird — zum Beispiel Termine abrufen, PDFs erstellen und auf den Share-Server hochladen.',

    'downloads.title': 'PDF Termine',
    'downloads.subtitle': 'Automatisch erstellt und immer aktuell',
    'downloads.description': 'Das GitHub-Repository pdf-termine erstellt automatisch Terminübersichten und lädt sie auf den Share-Server hoch.',
    'downloads.cards.title': 'Aktuelle PDFs herunterladen:',
    'downloads.terminuebersicht_hoch': 'Terminübersicht Hochformat',
    'downloads.terminuebersicht_quer': 'Terminübersicht Querformat',
    'downloads.repaircafe_hoch': 'Repair Café Hochformat',
    'downloads.repaircafe_quer': 'Repair Café Querformat',
    'downloads.btn': 'Herunterladen',

    'api.title': 'REST API & JSON',
    'api.subtitle': 'Wie Computer miteinander reden',
    'json.title': 'Was ist JSON?',
    'json.description': 'JSON ist eine Sprache, mit der Computer Daten austauschen. Wie eine Zutatenliste beim Backen: strukturiert, lesbar und von jedem Programm verstanden.',
    'json.example.label': 'Beispiel /events Antwort:',
    'rest.title': 'Was ist REST?',
    'rest.description': 'REST ist eine Methode, um Daten über das Internet abzurufen. Wie ein Kellner im Restaurant: du bestellst (Anfrage), der Kellner bringt das Essen (Antwort vom Server).',
    'rest.analogy.client': 'Du (Client)',
    'rest.analogy.waiter': 'API (Kellner)',
    'rest.analogy.kitchen': 'Server (Küche)',
    'api.teaching': 'Du möchtest mehr über REST APIs und JSON lernen? Beim Erfindergeist Jülich teilen wir unser Wissen gerne — komm einfach vorbei oder schreib uns an!',
    'api.teaching.contact': 'Kontakt aufnehmen',

    'ha.badge':    'Beispielprojekt',
    'ha.link':     'Zur Home Assistant Website',
    'ha.title':    'Home Assistant',
    'ha.subtitle': 'Automatisch informiert bleiben',
    'ha.what':     'Home Assistant ist eine quelloffene Smart-Home-Plattform, die du auf einem eigenen Gerät (z.B. Raspberry Pi) betreibst. Sie verbindet Lampen, Schalter, Sensoren und Dienste miteinander — und lässt sich frei automatisieren.',
    'ha.description': 'Unser /tomorrow-Endpunkt liefert nur die Termine von morgen — perfekt für Smart-Home-Automationen. Kein Filtern, kein Suchen: direkt die relevanten Daten.',
    'ha.usecase': 'Beispiel: Lass deinen Smart Speaker jeden Abend ansagen, ob morgen ein Termin beim Erfindergeist stattfindet.',
    'ha.yaml.intro': 'Das folgende Beispiel zeigt für Entwickler, wie eine solche Automation technisch aussehen kann:',

    'sponsor.title':       'Unterstütze uns!',
    'sponsor.subtitle':    'Gemeinnützig — und auf deine Hilfe angewiesen',
    'sponsor.description': 'Der Erfindergeist Jülich e.V. ist ein eingetragener gemeinnütziger Verein. Wir finanzieren uns ausschließlich durch Mitgliedsbeiträge, Förderungen und Spenden. Jeder Beitrag hilft uns, unsere Werkstatt offen zu halten und Projekte für alle anzubieten.',
    'sponsor.member':      'Fördermitglied werden',
    'sponsor.member.desc': 'Regelmäßige Unterstützung als Fördermitglied des Vereins',
    'sponsor.box':         'Spendendose',
    'sponsor.box.desc':    'Hinterlasse eine Spende direkt in unserer Werkstatt vor Ort',
    'sponsor.bank':        'Überweisung',
    'sponsor.bank.desc':   'Direkt auf unser Vereinskonto überweisen',
    'sponsor.paypal':      'PayPal',
    'sponsor.paypal.desc': 'Schnell und einfach online spenden',
    'sponsor.linktree':    'Alle Wege zur Unterstützung',

    'footer.text': 'Erfindergeist Jülich e.V.',
    'footer.source': 'Quelltext auf GitHub',
    'footer.plugin': 'WordPress Plugin',
    'footer.pdf': 'PDF Generator',

    'a11y.btn.label': 'Barrierefreiheits-Optionen',
    'a11y.title': 'Barrierefreiheit',
    'a11y.font.label': 'Schriftgröße',
    'a11y.font.decrease': 'Verkleinern',
    'a11y.font.reset': 'Standard',
    'a11y.font.increase': 'Vergrößern',
    'a11y.contrast.label': 'Kontrast',
    'a11y.contrast.normal': 'Normal',
    'a11y.contrast.high': 'Hoch',
    'a11y.motion.label': 'Animationen',
    'a11y.motion.on': 'An',
    'a11y.motion.off': 'Aus',
    'a11y.lang.label': 'Sprache',

    'scrolltop.label': 'Nach oben scrollen',
  },

  en: {
    'page.title': 'How does it work? — Erfindergeist Jülich',
    'skip.link': 'Skip to main content',

    'nav.architecture': 'Architecture',
    'nav.events': 'Events',
    'nav.ics': 'ICS Calendar',
    'nav.plugin': 'WordPress Plugin',
    'nav.downloads': 'PDF',
    'nav.homeassistant': 'Home Assistant',
    'nav.toggle.dark': 'Enable dark mode',
    'nav.toggle.light': 'Enable light mode',
    'nav.toggle.lang': 'Zu Deutsch wechseln',

    'hero.title': 'How does it work?',
    'hero.subtitle': 'Learn all about:',
    'hero.description': 'Discover the technical setup behind the Erfindergeist Jülich e.V. calendar — from NextCloud through the WordPress plugin to PDF files and smart home automations.',

    'events.title':        'Upcoming Events',
    'events.subtitle':     'The next events at a glance',
    'events.loading':      'Loading events…',
    'events.error':        'Events could not be loaded.',
    'events.empty':        'No upcoming events found.',
    'events.website.hint': 'All events are also available on our website:',
    'events.website.link': 'erfindergeist.org/veranstaltungen',

    'arch.title': 'Technical Architecture',
    'arch.subtitle': 'How your events travel through the internet',
    'arch.description': 'Everything starts in the cloud and ends up as a PDF in your hand or as a reminder on your smartphone.',
    'arch.node.nextcloud': 'NextCloud',
    'arch.node.wordpress': 'WordPress + Plugin',
    'arch.node.github': 'GitHub pdf-termine',
    'arch.node.events': '/events JSON',
    'arch.node.ics': '/ics Calendar',
    'arch.node.pdf': 'PDF Files',
    'arch.node.share': 'Share Server',
    'arch.legend.data': 'Data flow',
    'arch.legend.pdf': 'PDF generation',
    'arch.onesource.title':    'One source — many recipients',
    'arch.onesource.text':     'All our systems use the same event data from NextCloud — each receives it in exactly the format it needs.',
    'arch.onesource.site':     'This explainer page',
    'arch.onesource.homepage': 'Our homepage',
    'arch.onesource.pdf':      'PDF generation',
    'arch.onesource.cal':      'Personal calendars',
    'arch.onesource.yours':    'Your project?',
    'arch.help.text': 'We are happy to support individuals and associations with technical solutions — whether it\'s websites, automation or custom software projects. Just get in touch!',
    'arch.help.contact': 'Get in touch',

    'ics.title': 'What is ICS?',
    'ics.subtitle': 'The schedule file for your computer',
    'ics.description': 'An ICS file is like a digital timetable. Your calendar app (e.g. Google Calendar, Apple Calendar or Outlook) can read this file and automatically add all events.',
    'ics.analogy': 'Imagine a sheet of paper with all your appointments — ICS is exactly that, but for computers! Every program can read it.',
    'ics.autoupdate': 'Subscribe once, always up to date: Add our ICS link to Google Calendar, Outlook or Apple Calendar and new or updated events sync automatically — no re-import needed!',
    'ics.link.label':  'View our ICS file',
    'ics.copy.label':  'Copy ICS link',
    'ics.toast.text':  'ICS link copied to clipboard!',
    'ics.example.title': 'This is what an ICS file looks like:',

    'plugin.title': 'The WordPress Plugin',
    'plugin.subtitle': 'The bridge between cloud and website',
    'plugin.description': 'The custom-built WordPress plugin fetches events from NextCloud, caches them, and provides them as a modern web API.',
    'plugin.caching.label': 'Why caching?',
    'plugin.caching.desc': 'Instead of querying NextCloud on every request, the plugin temporarily stores the data. This is faster and easier on the server.',
    'plugin.endpoints.title': 'These endpoints are available:',
    'plugin.github.label': 'View plugin on GitHub',
    'plugin.endpoint.events.desc': 'All events as JSON',
    'plugin.endpoint.tomorrow.desc': "Only tomorrow's events",
    'plugin.endpoint.tomorrow.hint': "Note: The /tomorrow endpoint only returns data if there is actually an event scheduled for tomorrow. If nothing is planned, the response will be empty.",
    'plugin.open.label': 'Open for everyone',
    'plugin.open.desc':  'All endpoints are publicly accessible and require no login. Feel free to use them in your own private project — whether smart home, app or website.',

    'pdf.title': 'PDF Generator',
    'pdf.subtitle': 'Automatically create beautiful PDFs',
    'pdf.description': 'The GitHub repository pdf-termine automatically creates event overviews as PDF files and uploads them to the share server — fully automated with GitHub Actions.',
    'pdf.step1': 'GitHub Actions starts automatically',
    'pdf.step2': 'Events are fetched',
    'pdf.step3': 'PDF is created',
    'pdf.step4': 'Uploaded to Share',
    'pdf.schedule': 'PDFs are automatically regenerated every Monday at 3:00 AM — so they are always up to date.',
    'pdf.github.label': 'pdf-termine on GitHub',
    'pdf.share.label':  'share.erfindergeist.org',
    'pdf.vc.title':       'Version Control with GitHub',
    'pdf.vc.text':        'GitHub stores every change to the code with a timestamp — making it easy to see what changed and when, and to restore older versions at any time.',
    'pdf.workflow.title': 'Automated Workflows with GitHub Actions',
    'pdf.workflow.text':  'GitHub Actions runs tasks automatically whenever a change is pushed — for example fetching events, generating PDFs and uploading them to the share server.',

    'downloads.title': 'PDF Schedule',
    'downloads.subtitle': 'Automatically generated and always up to date',
    'downloads.description': 'The pdf-termine GitHub repository automatically creates event overviews and uploads them to the share server.',
    'downloads.cards.title': 'Download current PDFs:',
    'downloads.terminuebersicht_hoch': 'Event Overview Portrait',
    'downloads.terminuebersicht_quer': 'Event Overview Landscape',
    'downloads.repaircafe_hoch': 'Repair Café Portrait',
    'downloads.repaircafe_quer': 'Repair Café Landscape',
    'downloads.btn': 'Download',

    'api.title': 'REST API & JSON',
    'api.subtitle': 'How computers talk to each other',
    'json.title': 'What is JSON?',
    'json.description': 'JSON is a language computers use to exchange data. Like an ingredient list when baking: structured, readable, and understood by every program.',
    'json.example.label': 'Example /events response:',
    'rest.title': 'What is REST?',
    'rest.description': 'REST is a method for retrieving data over the internet. Like a waiter at a restaurant: you order (request), the waiter brings the food (response from the server).',
    'rest.analogy.client': 'You (Client)',
    'rest.analogy.waiter': 'API (Waiter)',
    'rest.analogy.kitchen': 'Server (Kitchen)',
    'api.teaching': 'Want to learn more about REST APIs and JSON? At Erfindergeist Jülich we love sharing our knowledge — just come by or send us a message!',
    'api.teaching.contact': 'Get in touch',

    'ha.badge':    'Example project',
    'ha.link':     'Visit Home Assistant website',
    'ha.title':    'Home Assistant',
    'ha.subtitle': 'Stay automatically informed',
    'ha.what':     'Home Assistant is an open-source smart home platform that runs on your own device (e.g. a Raspberry Pi). It connects lights, switches, sensors and services — and can be automated freely.',
    'ha.description': "Our /tomorrow endpoint returns only tomorrow's events — perfect for smart home automations. No filtering, no searching: directly the relevant data.",
    'ha.usecase': "Example: Have your smart speaker announce each evening whether there's an Erfindergeist event tomorrow.",
    'ha.yaml.intro': 'The following example shows developers how such an automation can be built technically:',

    'sponsor.title':       'Support Us!',
    'sponsor.subtitle':    'Non-profit — and relying on your help',
    'sponsor.description': 'Erfindergeist Jülich e.V. is a registered non-profit association. We are funded solely through membership fees, grants and donations. Every contribution helps us keep our workshop open and offer projects for everyone.',
    'sponsor.member':      'Become a supporting member',
    'sponsor.member.desc': 'Regular support as a contributing member of the association',
    'sponsor.box':         'Donation box',
    'sponsor.box.desc':    'Leave a donation directly at our workshop in person',
    'sponsor.bank':        'Bank transfer',
    'sponsor.bank.desc':   'Transfer directly to our club account',
    'sponsor.paypal':      'PayPal',
    'sponsor.paypal.desc': 'Quick and easy online donation',
    'sponsor.linktree':    'All ways to support us',

    'footer.text': 'Erfindergeist Jülich e.V.',
    'footer.source': 'Source on GitHub',
    'footer.plugin': 'WordPress Plugin',
    'footer.pdf': 'PDF Generator',

    'a11y.btn.label': 'Accessibility options',
    'a11y.title': 'Accessibility',
    'a11y.font.label': 'Font size',
    'a11y.font.decrease': 'Decrease',
    'a11y.font.reset': 'Default',
    'a11y.font.increase': 'Increase',
    'a11y.contrast.label': 'Contrast',
    'a11y.contrast.normal': 'Normal',
    'a11y.contrast.high': 'High',
    'a11y.motion.label': 'Animations',
    'a11y.motion.on': 'On',
    'a11y.motion.off': 'Off',
    'a11y.lang.label': 'Language',

    'scrolltop.label': 'Scroll to top',
  },
};

let currentLang = 'de';

window.t = function (key) {
  return (translations[currentLang] && translations[currentLang][key]) || key;
};

function applyTranslations(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.title = window.t('page.title');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const val = window.t(key);
    if (attr) {
      el.setAttribute(attr, val);
    } else {
      el.textContent = val;
    }
  });

  // Update SVG text nodes (data-i18n on SVG <text>)
  document.querySelectorAll('text[data-i18n]').forEach(el => {
    el.textContent = window.t(el.getAttribute('data-i18n'));
  });

  localStorage.setItem('lang', lang);

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.textContent = lang === 'de' ? 'EN' : 'DE';
    langBtn.setAttribute('aria-label', window.t('nav.toggle.lang'));
  }

  // Update theme button aria-label
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', isDark ? window.t('nav.toggle.light') : window.t('nav.toggle.dark'));
  }

  // Re-init Typed.js with new strings
  if (window.typedInstance) {
    window.typedInstance.destroy();
    if (!document.documentElement.classList.contains('reduce-motion')) {
      window.initTyped && window.initTyped();
    }
  }
}

function toggleLanguage() {
  applyTranslations(currentLang === 'de' ? 'en' : 'de');
}

function initI18n() {
  const saved = localStorage.getItem('lang') || 'de';
  applyTranslations(saved);
}
