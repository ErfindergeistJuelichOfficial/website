'use strict';

const translations = {
  de: {
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
    'events.json.label':   'Live JSON',
    'events.event.label':  'Termine',
    'events.show_me':      'Zeig es mir',
    'events.json.reset':   'Zurücksetzen',
    'events.source.pre':   'Was du hier siehst, kommt live vom',
    'events.source.post':  'Endpunkt — direkt aus der Datenbank, ohne Zwischenspeicherung. Das JSON ist stark vereinfacht dargestellt, um das Prinzip leichter verständlich zu machen. Trau dich: Verändere die LIVE-Daten im Editor und schau was passiert! Hinter jeder Veranstaltung steckt ein JSON-Objekt — und Objekte erkennst du immer an { }. Schau, was drin steckt:',
    'events.json.explain.obj':       '← ein Termin steckt hier drin',
    'events.json.explain.key':       '← da ist der Titel!',
    'events.json.explain.obj_label': '= Objekt',
    'events.json.explain.key_label': '= Key (Schlüssel)',
    'events.json.explain.val_label': '= Value (Wert)',
    'events.website.hint':  'Alle Termine findest du auch auf unserer Website:',
    'events.website.link':  'erfindergeist.org/veranstaltungen',

    'arch.title': 'Technischer Aufbau',
    'arch.subtitle': 'So reisen deine Termine durch das Internet',
    'arch.description': 'Alles beginnt in der Cloud und landet am Ende als PDF in deiner Hand oder als Erinnerung auf deinem Smartphone.',
    'arch.onesource.title':    'Eine Quelle — viele Empfänger',
    'arch.onesource.text':     'Mitglieder pflegen alle Termine an einem einzigen Ort: in NextCloud. Neue Veranstaltungen anlegen, bestehende aktualisieren oder vergangene löschen — das alles passiert dort, ganz ohne technisches Vorwissen. Das WordPress-Plugin holt sich diese Daten regelmäßig ab und stellt sie als zentrale Schnittstelle für alle anderen Systeme bereit. Egal ob PDF-Generator, persönlicher Kalender oder Smart-Home-Automation — jedes System bekommt genau die Daten, die es braucht, in genau dem Format, das es versteht.',
    'arch.onesource.site':     'Diese Erklär-Seite',
    'arch.onesource.homepage': 'Unsere Homepage',
    'arch.onesource.pdf':      'PDF Erzeugung',
    'arch.onesource.cal':      'Persönliche Kalender',
    'arch.onesource.yours':    'Dein Projekt?',
    'arch.help.text': 'Wir unterstützen gerne jeden bei technischen Lösungen — egal ob Website, Automatisierung oder eigene Softwareprojekte. Sprich uns einfach an!',
    'arch.help.contact': 'Kontakt aufnehmen',

    'ics.title': 'Was ist ICS?',
    'ics.subtitle': 'Der Stundenplan für deinen Computer',
    'ics.description': 'Eine ICS-Datei ist wie ein digitaler Stundenplan. Dein Kalender-Programm (z.B. Google Kalender, Apple Kalender oder Outlook) kann diese Datei lesen und alle Termine automatisch eintragen.',
    'ics.analogy': 'Stell dir vor, du hast einen Zettel mit allen Terminen — ICS ist genau das, aber für Computer! Jedes Programm kann es lesen.',
    'ics.autoupdate': 'Einmal abonnieren, immer aktuell: Wenn du unsere ICS-Datei in Google Kalender, Outlook oder Apple Kalender einbindest, werden neue und geänderte Termine automatisch übernommen — ganz ohne erneuten Import!',
    'ics.link.label':  'Unsere ICS-Datei ansehen',
    'ics.copy.label':  'ICS-Link kopieren',
    'ics.cal.label':   'Abonnieren in:',
    'ics.toast.text':  'ICS-Link in Zwischenablage kopiert!',
    'ics.example.title': 'So sieht eine ICS-Datei aus:',
    'ics.puzzle.question':  'Welches Datum und welche Uhrzeit steht bei DTSTART',
    'ics.puzzle.lbl.year':  'Jahr',
    'ics.puzzle.lbl.month': 'Mo',
    'ics.puzzle.lbl.day':   'Tag',
    'ics.puzzle.lbl.hour':  'Std',
    'ics.puzzle.lbl.minute':'Min',
    'ics.puzzle.success':   'Perfekt! Du hast DTSTART korrekt gelesen.',
    'ics.puzzle.reset':     'Zurücksetzen',

    'plugin.title': 'Das WordPress Plugin',
    'plugin.subtitle': 'Die Brücke zwischen Cloud und Website',
    'plugin.description': 'Das selbst entwickelte WordPress-Plugin holt die Termine aus der NextCloud und stellt sie über drei Endpunkte bereit — jeder liefert die gleichen Daten, nur in einem anderen Format. Endpunkte sind wie Türen: du klopfst an, das Plugin öffnet und gibt dir genau das zurück, was du brauchst. <code>/ics</code> reicht die ICS-Datei direkt aus NextCloud weiter — unverändert, zum Abonnieren. <code>/events</code> liefert denselben Inhalt als JSON, maschinenlesbar und perfekt für Apps. <code>/tomorrow</code> zeigt nur den Termin von morgen — aber nur, wenn morgen wirklich etwas los ist. Alle drei Endpunkte sind <strong>GET</strong>-Anfragen — das bedeutet: reines Abrufen, kein Schreiben, kein Anmelden. Einfach die URL in den Browser eingeben und die Daten landen direkt auf dem Bildschirm.',
    'plugin.caching.label': 'Warum Caching?',
    'plugin.caching.desc': 'Statt bei jeder Anfrage die NextCloud zu befragen, speichert das Plugin die Daten kurz zwischen. Das ist schneller und schont den Server.',
    'plugin.endpoints.title': 'Diese Endpunkte stehen zur Verfügung:',
    'plugin.github.label': 'Plugin auf GitHub ansehen',
    'plugin.endpoint.events.desc': 'Alle Termine als JSON',
    'plugin.events.hint':          'Tipp: Klick öffnet rohe API-Daten — kein CSS, keine Bilder, nur echtes JSON.',
    'plugin.events.count.label':   'Termine gerade live',
    'plugin.events.challenge':     'Kannst du den Titel des dritten Events finden',
    'plugin.endpoint.tomorrow.desc': 'Nur die Termine von morgen',
    'plugin.tomorrow.empty': 'Ich hab schon mal nachgeschaut — morgen ist nichts los. 😴 Schau in den Termine-Bereich und komm an einem anderen Tag wieder, um den anderen Fall zu sehen!',
    'plugin.tomorrow.found': 'Ich hab schon mal nachgeschaut, um dich vorzuwarnen — morgen ist was los! 🎉 Schau in den Termine-Bereich und komm an einem anderen Tag wieder, um den leeren Fall zu sehen!',
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
    'pdf.vc.text':        'GitHub ist das Gedächtnis des Projekts. Im Repository steckt das Template unserer Terminliste und der Code, der alles zusammenhält: Er fragt die Events-API nach den aktuellen Terminen, fügt sie ins Template ein und erzeugt daraus ein druckfertiges PDF. Jede Änderung - ob am Layout oder am Code - wird mit Zeitstempel gespeichert. Nichts geht verloren, ältere Versionen lassen sich jederzeit wiederherstellen.',
    'pdf.workflow.title': 'Automatische Workflows mit GitHub Actions',
    'pdf.workflow.text':  'Der Code im Repository ist wie ein Drehbuch - präzise geschrieben, aber von allein passiert gar nichts. GitHub Actions haucht ihm Leben ein: Sobald eine Änderung hochgeladen wird, startet der Workflow automatisch, führt den Code aus, holt die aktuellen Termine von der Events-API, baut sie ins Template ein, erzeugt das PDF und lädt es auf den Share-Server hoch. Kein Knopfdruck, kein Warten - alles läuft von selbst, zuverlässig, im Hintergrund.',

    'downloads.title': 'PDF Termine',
    'downloads.subtitle': 'Aktuelle PDFs — immer einen Klick entfernt',
    'downloads.description': 'Das GitHub-Repository pdf-termine erstellt automatisch Terminübersichten und lädt sie auf den Share-Server hoch.',
    'downloads.terminuebersicht_hoch': 'Termine alle Hochformat',
    'downloads.terminuebersicht_quer': 'Termine alle Querformat',
    'downloads.repaircafe_hoch': 'Termine Repair Café Hochformat',
    'downloads.repaircafe_quer': 'Termine Repair Café Querformat',
    'downloads.btn':        'Herunterladen',
    'downloads.copy.label': 'Link kopieren',
    'downloads.copy.text':  'Link in Zwischenablage kopiert!',

    'pdf.countdown.label': 'Nächste Aktualisierung in',
    'pdf.countdown.d': 'T',
    'pdf.countdown.h': 'h',
    'pdf.countdown.m': 'm',
    'pdf.countdown.s': 's',

    'arch.nextcloud.title': 'Was ist NextCloud?',
    'arch.nextcloud.text':  'NextCloud ist eine selbst gehostete Cloud-Plattform — wie Google Drive, nur auf unserem eigenen Server. Alle Termine werden dort gepflegt: neue anlegen, bestehende ändern, vergangene löschen. Volle Kontrolle über die eigenen Daten, ganz ohne externe Dienste.',
    'pdf.share.hint': 'share.erfindergeist.org ist unser öffentlicher Bereich, auf dem wir Dateien zum Download bereitstellen — PDFs, Terminübersichten und alles, was wir gerne mit euch teilen möchten.',

    'ha.badge':    'Beispielprojekt',
    'ha.link':     'Zur Home Assistant Website',
    'ha.title':    'Home Assistant',
    'ha.subtitle': 'Automatisch informiert bleiben',
    'ha.what':     'Home Assistant ist eine quelloffene Smart-Home-Plattform, die du auf einem eigenen Gerät (z.B. Raspberry Pi) betreibst. Sie verbindet Lampen, Schalter, Sensoren und Dienste miteinander — und lässt sich frei automatisieren.',
    'ha.description': 'Unser /tomorrow-Endpunkt liefert nur die Termine von morgen — perfekt für Smart-Home-Automationen. Kein Filtern, kein Suchen: direkt die relevanten Daten.',
    'ha.usecase': 'Beispiel: Lass deinen Smart Speaker jeden Abend ansagen, ob morgen ein Termin beim Erfindergeist stattfindet.',
    'ha.yaml.intro': 'Das folgende Beispiel zeigt für Entwickler, wie eine solche Automation technisch aussehen kann:',

    'achievements.title':    'Errungenschaften',
    'achievements.subtitle': 'Jede Entdeckung hinterlässt eine Spur',
    'achievements.counter':  'freigeschaltet',
    'achievements.reset':    'Zurücksetzen',

    'achievement.bell_click.name': 'Erstes Läuten',
    'achievement.bell_click.desc': 'Du hast die Glocke zum ersten Mal zum Klingen gebracht.',
    'achievement.bell_click.hint': 'Klingt nach etwas...',

    'achievement.bell_spin.name': 'Volldreher',
    'achievement.bell_spin.desc': '360° - die Glocke hat sich komplett um die eigene Achse gedreht!',
    'achievement.bell_spin.hint': 'Mehr Klicks, mehr Schwung...',

    'achievement.ics_solved.name': 'Zeitdetektiv',
    'achievement.ics_solved.desc': 'Das ICS-Datums-Rätsel geknackt!',
    'achievement.ics_solved.hint': 'Drehe an den richtigen Rädern...',

    'achievement.rocket.name': 'Abgehoben!',
    'achievement.rocket.desc': 'Die Rakete ist gestartet - Ziel: Share-Server!',
    'achievement.rocket.hint': 'Irgendetwas wartet auf den richtigen Moment...',

    'achievement.show_me.name': 'Verbindungssucher',
    'achievement.show_me.desc': 'Du hast die Brücke zwischen Termin und JSON sichtbar gemacht.',
    'achievement.show_me.hint': 'Siehst du die Verbindung?',

    'achievement.zap.name': 'Blitzeinschlag',
    'achievement.zap.desc': 'Der Blitz hat voll eingeschlagen!',
    'achievement.zap.hint': 'Energie liegt in der Luft...',

    'achievement.json_edit.name': 'Daten-Hacker',
    'achievement.json_edit.desc': 'Du hast die Live-Daten eigenhändig verändert!',
    'achievement.json_edit.hint': 'Die Daten sind formbar...',

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

    'footer.text':               'Erfindergeist Jülich e.V.',
    'footer.section.nav':        'Navigation',
    'footer.section.pdf':        'PDF Downloads',
    'footer.section.endpoints':  'Endpunkte',
    'footer.section.subscribe':  'Abonnieren',
    'footer.impressum':          'Impressum',
    'footer.contact':            'Kontakt',
    'footer.privacy':            'Datenschutz',
    'footer.cookie':             'EU-Cookie-Richtlinie',

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
    'events.json.label':   'Live JSON',
    'events.event.label':  'Events',
    'events.show_me':      'Show me!',
    'events.json.reset':   'Reset',
    'events.source.pre':   'What you see below is fetched live from the',
    'events.source.post':  'endpoint — directly from the database, no caching. The JSON is heavily simplified to make the concept easier to understand. Go ahead: edit the LIVE data in the editor and see what happens! Every event is a JSON object — and you can always spot an object by its curly braces { }. Take a look at what\'s inside:',
    'events.json.explain.obj':       '← an entire event lives in here',
    'events.json.explain.key':       '← there\'s the title!',
    'events.json.explain.obj_label': '= Object',
    'events.json.explain.key_label': '= Key',
    'events.json.explain.val_label': '= Value',
    'events.website.hint':  'All events are also available on our website:',
    'events.website.link':  'erfindergeist.org/veranstaltungen',

    'arch.title': 'Technical Architecture',
    'arch.subtitle': 'How your events travel through the internet',
    'arch.description': 'Everything starts in the cloud and ends up as a PDF in your hand or as a reminder on your smartphone.',
    'arch.onesource.title':    'One source — many recipients',
    'arch.onesource.text':     'Members manage all events in one single place: NextCloud. Add new events, update existing ones or remove past entries — all of that happens right there, no technical knowledge required. The WordPress plugin regularly fetches this data and makes it available as a central interface for every other system. Whether it\'s the PDF generator, your personal calendar or a smart home automation — each system gets exactly the data it needs, in exactly the format it understands.',
    'arch.onesource.site':     'This explainer page',
    'arch.onesource.homepage': 'Our homepage',
    'arch.onesource.pdf':      'PDF generation',
    'arch.onesource.cal':      'Personal calendars',
    'arch.onesource.yours':    'Your project?',
    'arch.help.text': 'We are happy to support anyone with technical solutions — whether it\'s websites, automation or custom software projects. Just get in touch!',
    'arch.help.contact': 'Get in touch',

    'ics.title': 'What is ICS?',
    'ics.subtitle': 'The schedule file for your computer',
    'ics.description': 'An ICS file is like a digital timetable. Your calendar app (e.g. Google Calendar, Apple Calendar or Outlook) can read this file and automatically add all events.',
    'ics.analogy': 'Imagine a sheet of paper with all your appointments — ICS is exactly that, but for computers! Every program can read it.',
    'ics.autoupdate': 'Subscribe once, always up to date: Add our ICS link to Google Calendar, Outlook or Apple Calendar and new or updated events sync automatically — no re-import needed!',
    'ics.link.label':  'View our ICS file',
    'ics.copy.label':  'Copy ICS link',
    'ics.cal.label':   'Subscribe in:',
    'ics.toast.text':  'ICS link copied to clipboard!',
    'ics.example.title': 'This is what an ICS file looks like:',
    'ics.puzzle.question':  'What date and time is shown in DTSTART',
    'ics.puzzle.lbl.year':  'Year',
    'ics.puzzle.lbl.month': 'Mo',
    'ics.puzzle.lbl.day':   'Day',
    'ics.puzzle.lbl.hour':  'Hr',
    'ics.puzzle.lbl.minute':'Min',
    'ics.puzzle.success':   'Perfect! You read DTSTART correctly.',
    'ics.puzzle.reset':     'Reset',

    'plugin.title': 'The WordPress Plugin',
    'plugin.subtitle': 'The bridge between cloud and website',
    'plugin.description': 'The custom-built WordPress plugin fetches events from NextCloud and serves them through three endpoints — each returning the same data, just in a different format. Endpoints are like doors: you knock, the plugin answers and hands you exactly what you need. <code>/ics</code> passes the ICS file straight from NextCloud — unchanged, ready to subscribe. <code>/events</code> delivers the same content as JSON, machine-readable and perfect for apps. <code>/tomorrow</code> shows only tomorrow\'s event — but only if something is actually happening tomorrow. All three endpoints are <strong>GET</strong> requests — meaning pure retrieval, no writing, no login required. Just paste the URL into your browser and the data appears right on screen.',
    'plugin.caching.label': 'Why caching?',
    'plugin.caching.desc': 'Instead of querying NextCloud on every request, the plugin temporarily stores the data. This is faster and easier on the server.',
    'plugin.endpoints.title': 'These endpoints are available:',
    'plugin.github.label': 'View plugin on GitHub',
    'plugin.endpoint.events.desc': 'All events as JSON',
    'plugin.events.hint':          'Tip: clicking opens raw API data — no CSS, no images, pure JSON.',
    'plugin.events.count.label':   'events live right now',
    'plugin.events.challenge':     'Can you find the title of the third event',
    'plugin.endpoint.tomorrow.desc': "Only tomorrow's events",
    'plugin.tomorrow.empty': 'Already checked for you — nothing on tomorrow. 😴 Check the events section and come back another day to see the other case!',
    'plugin.tomorrow.found': "Already checked to give you a heads-up — something's on tomorrow! 🎉 Check the events section and come back another day to see the empty case!",
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
    'pdf.vc.text':        'GitHub is the project\'s memory. Inside the repository lives the template for our event list and the code that ties everything together: it queries the Events API for current events, slots them into the template, and produces a print-ready PDF. Every change — to the layout or the code — is saved with a timestamp. Nothing is ever lost, and older versions can be restored at any time.',
    'pdf.workflow.title': 'Automated Workflows with GitHub Actions',
    'pdf.workflow.text':  'The code in the repository is like a screenplay — precisely written, but nothing happens on its own. GitHub Actions is what brings it to life: the moment a change is pushed, the workflow fires automatically, runs the code, fetches the latest events from the Events API, slots them into the template, generates the PDF, and uploads it to the share server. No button press, no waiting — everything runs by itself, reliably, in the background.',

    'downloads.title': 'PDF Schedule',
    'downloads.subtitle': 'Current PDFs — always just a click away',
    'downloads.description': 'The pdf-termine GitHub repository automatically creates event overviews and uploads them to the share server.',
    'downloads.terminuebersicht_hoch': 'Events Overview Portrait',
    'downloads.terminuebersicht_quer': 'Events Overview Landscape',
    'downloads.repaircafe_hoch': 'Events Repair Café Portrait',
    'downloads.repaircafe_quer': 'Events Repair Café Landscape',
    'downloads.btn':        'Download',
    'downloads.copy.label': 'Copy link',
    'downloads.copy.text':  'Link copied to clipboard!',

    'pdf.countdown.label': 'Next update in',
    'pdf.countdown.d': 'd',
    'pdf.countdown.h': 'h',
    'pdf.countdown.m': 'm',
    'pdf.countdown.s': 's',

    'arch.nextcloud.title': 'What is NextCloud?',
    'arch.nextcloud.text':  'NextCloud is a self-hosted cloud platform — like Google Drive, but running on our own server. All events are managed there: add new ones, edit existing ones, remove past ones. Full control over our own data, no external services needed.',
    'pdf.share.hint': 'share.erfindergeist.org is our public area where we make files available for download — PDFs, event overviews and everything we\'d like to share with you.',

    'ha.badge':    'Example project',
    'ha.link':     'Visit Home Assistant website',
    'ha.title':    'Home Assistant',
    'ha.subtitle': 'Stay automatically informed',
    'ha.what':     'Home Assistant is an open-source smart home platform that runs on your own device (e.g. a Raspberry Pi). It connects lights, switches, sensors and services — and can be automated freely.',
    'ha.description': "Our /tomorrow endpoint returns only tomorrow's events — perfect for smart home automations. No filtering, no searching: directly the relevant data.",
    'ha.usecase': "Example: Have your smart speaker announce each evening whether there's an Erfindergeist event tomorrow.",
    'ha.yaml.intro': 'The following example shows developers how such an automation can be built technically:',

    'achievements.title':    'Achievements',
    'achievements.subtitle': 'Every discovery leaves a trace',
    'achievements.counter':  'unlocked',
    'achievements.reset':    'Reset',

    'achievement.bell_click.name': 'First Ring',
    'achievement.bell_click.desc': 'You rang the bell for the very first time.',
    'achievement.bell_click.hint': 'Sounds like something...',

    'achievement.bell_spin.name': 'Full Spin',
    'achievement.bell_spin.desc': '360° — the bell did a complete rotation!',
    'achievement.bell_spin.hint': 'More clicks, more momentum...',

    'achievement.ics_solved.name': 'Time Detective',
    'achievement.ics_solved.desc': 'You cracked the ICS date puzzle!',
    'achievement.ics_solved.hint': 'Turn the right wheels...',

    'achievement.rocket.name': 'Lift-off!',
    'achievement.rocket.desc': 'The rocket has launched — destination: share server!',
    'achievement.rocket.hint': 'Something is waiting for the right moment...',

    'achievement.show_me.name': 'Connection Found',
    'achievement.show_me.desc': 'You revealed the bridge between event and JSON.',
    'achievement.show_me.hint': 'Can you see the connection?',

    'achievement.zap.name': 'Lightning Strike',
    'achievement.zap.desc': 'The lightning struck with full force!',
    'achievement.zap.hint': 'Energy is in the air...',

    'achievement.json_edit.name': 'Data Hacker',
    'achievement.json_edit.desc': 'You modified the live data with your own hands!',
    'achievement.json_edit.hint': 'Data is malleable...',

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

    'footer.text':               'Erfindergeist Jülich e.V.',
    'footer.section.nav':        'Navigation',
    'footer.section.pdf':        'PDF Downloads',
    'footer.section.endpoints':  'Endpoints',
    'footer.section.subscribe':  'Subscribe',
    'footer.impressum':          'Impressum',
    'footer.contact':            'Contact',
    'footer.privacy':            'Privacy Policy',
    'footer.cookie':             'EU Cookie Policy',

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
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    const val = window.t(key);
    if (attr) {
      el.setAttribute(attr, val);
    } else if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
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
