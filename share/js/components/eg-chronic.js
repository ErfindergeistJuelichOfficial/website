'use strict';

(function () {
  if (customElements.get('eg-chronic')) { return; }

  var CHRONICLE_URL = 'https://share.erfindergeist.org/config/chronicle.json';
  var LINKS_URL     = 'https://share.erfindergeist.org/config/links.json';

  var MONTHS = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;');
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function buildHtml(events, linkMap) {
    var html         = '';
    var currentYear  = null;
    var currentMonth = null;

    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var parts = event.date.split('-');
      var year  = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1;
      var day   = parseInt(parts[2], 10);

      if (year !== currentYear) {
        if (currentMonth !== null) { html += '</ul>'; }
        if (currentYear  !== null) { html += '</section>'; }
        html += '<section>';
        html += '<h2>Jahresrückblick ' + year + '</h2>';
        currentYear  = year;
        currentMonth = null;
      }

      if (month !== currentMonth) {
        if (currentMonth !== null) { html += '</ul>'; }
        html += '<h3>' + MONTHS[month] + ' ' + year + '</h3>';
        html += '<ul>';
        currentMonth = month;
      }

      var text        = event.description || event.location || '';
      var linkAnchors = [];
      var ids         = event.link_ids || [];
      for (var j = 0; j < ids.length; j++) {
        var link  = linkMap[ids[j]];
        if (!link) { continue; }
        var label = link.title || link.type || '';
        if (!label) { continue; }
        linkAnchors.push(
          '<a href="' + escHtml(link.url) + '"'
          + ' target="_blank" rel="noopener noreferrer">'
          + escHtml(label) + '</a>'
        );
      }

      html += '<li>';
      html += pad2(day) + '. ' + MONTHS[month] + ': ';
      html += '<b>' + escHtml(event.title) + '</b>';
      if (text) {
        html += ' ' + escHtml(text) + '.';
      }
      if (linkAnchors.length) {
        html += ' ' + linkAnchors.join(', ');
      }
      html += '</li>';
    }

    if (currentMonth !== null) { html += '</ul>'; }
    if (currentYear  !== null) { html += '</section>'; }

    return html || '<p>Keine Einträge gefunden.</p>';
  }

  class EgChronic extends HTMLElement {
    connectedCallback() {
      this.innerHTML = '<p role="status">Lade Chronik ...</p>';

      Promise.all([
        fetch(CHRONICLE_URL).then(function (r) { return r.json(); }),
        fetch(LINKS_URL).then(function (r) { return r.json(); })
      ]).then(function (results) {
        var chronicleData = results[0];
        var linksData     = results[1];

        var linkMap   = {};
        var listItems = linksData.itemListElement || [];
        for (var i = 0; i < listItems.length; i++) {
          var item = listItems[i].item || {};
          if (item['@id']) { linkMap[item['@id']] = item; }
        }

        var events = (chronicleData.itemListElement || []).slice();
        events.sort(function (a, b) { return b.date.localeCompare(a.date); });

        this.innerHTML = buildHtml(events, linkMap);
      }.bind(this)).catch(function () {
        this.innerHTML = '<p>Chronik konnte nicht geladen werden.</p>';
      }.bind(this));
    }
  }

  customElements.define('eg-chronic', EgChronic);
}());
