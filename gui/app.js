/* ═══════════════════════════════════════════════
   Global state
═══════════════════════════════════════════════ */
var state = { chronicle: {}, links: {}, tags: {}, albums: [], downloads: [] };
var currentAlbumPath = null;
var currentDownloadPath = null;
var currentLinkId = null;
var imagePickerMode = null; // 'preview', 'blur', 'noblur'

var LINK_TYPES = ['website','service','social','github','api','sponsoring','galerie','extern','blog','cloud','raw','wiki'];

function linkById(id) {
  var found = null;
  $.each(state.links.itemListElement || [], function (_, li) {
    if (li.item && li.item['@id'] === id) { found = li.item; return false; }
  });
  return found;
}

function linkLabel(lnk) {
  if (!lnk) { return ''; }
  var t = (lnk.title || '').trim();
  if (t) { return t; }
  var tp = (lnk.type || '').trim();
  return tp ? tp.charAt(0).toUpperCase() + tp.slice(1) : (lnk.url || '');
}

/* ═══════════════════════════════════════════════
   Utilities
═══════════════════════════════════════════════ */
function showToast(msg, ok) {
  var $t = $('#main-toast');
  $('#toast-msg').text(msg);
  $t.attr('class', 'toast align-items-center border-0 text-bg-' + (ok ? 'success' : 'danger'));
  bootstrap.Toast.getOrCreateInstance($t[0], { delay: 3200 }).show();
}

function egFormatDate(iso) {
  if (!iso) { return ''; }
  var p = iso.split('-');
  return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
}

function sanitize(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ═══════════════════════════════════════════════
   Chip input helpers
═══════════════════════════════════════════════ */
function chipContainerValues($container) {
  return $container.find('.chip').map(function () { return $(this).data('value'); }).get();
}

function addChip($container, value) {
  if (!String(value).trim()) { return; }
  var v = String(value).trim();
  if (chipContainerValues($container).indexOf(v) !== -1) { return; }
  var $chip = $('<span>').addClass('chip').data('value', v)
    .html(sanitize(v) + '<button type="button" class="chip-remove" aria-label="Entfernen">×</button>');
  $chip.find('.chip-remove').on('click', function () { $chip.remove(); });
  $chip.insertBefore($container.find('input'));
}

function clearChips($container) {
  $container.find('.chip').remove();
}

function initChipInput($container) {
  var $input = $container.find('input');
  if (!$input.length) { return; }
  $input.on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChip($container, $input.val());
      $input.val('');
    }
  });
  if ($input.attr('list')) {
    $input.on('input', function () {
      var val = $input.val();
      if (!val) { return; }
      var matched = $('#' + $input.attr('list')).find('option').filter(function () {
        return $(this).val() === val;
      }).length > 0;
      if (matched) { addChip($container, val); $input.val(''); }
    });
  }
  $container.on('click', function () { $input.trigger('focus'); });
}

/* ═══════════════════════════════════════════════
   Tags multi-select dropdown helper
═══════════════════════════════════════════════ */
function buildTagsMenu($menuEl, $badgesEl, $btnEl, selectedKeys) {
  var allTags = {};
  $.each(state.tags.location_tags || {}, function (k, v) { allTags[k] = v.label || k; });
  $.each(state.tags.description_tags || {}, function (k, v) { allTags[k] = v.label || k; });
  $menuEl.empty();
  $.each(allTags, function (key, label) {
    var $li = $('<li>').html(
      '<label class="dropdown-item d-flex gap-2 align-items-center" style="cursor:pointer;">'
      + '<input type="checkbox" value="' + sanitize(key) + '"' + (selectedKeys.indexOf(key) !== -1 ? ' checked' : '') + '>'
      + sanitize(label) + ' <small class="text-muted ms-auto">' + sanitize(key) + '</small></label>'
    );
    $li.find('input').on('change', function () { syncTagBadges($menuEl, $badgesEl, $btnEl); });
    $menuEl.append($li);
  });
  syncTagBadges($menuEl, $badgesEl, $btnEl);
}

function syncTagBadges($menuEl, $badgesEl, $btnEl) {
  var sel = $menuEl.find('input:checked').map(function () { return $(this).val(); }).get();
  $badgesEl.html($.map(sel, function (k) {
    return '<span class="badge" style="background:rgba(var(--color-primary-rgb),.18);color:var(--color-primary);">' + sanitize(k) + '</span>';
  }).join(' '));
  $btnEl.text(sel.length ? 'Tags (' + sel.length + ')' : 'Tags auswählen');
}

function getSelectedTags($menuEl) {
  return $menuEl.find('input:checked').map(function () { return $(this).val(); }).get();
}

/* ═══════════════════════════════════════════════
   Location datalist
═══════════════════════════════════════════════ */
function initLocDatalist() {
  var locs = [];
  $.each(state.chronicle.itemListElement || [], function (_, e) {
    if (e.location && locs.indexOf(e.location) === -1) { locs.push(e.location); }
  });
  $('#loc-datalist').html($.map(locs, function (l) { return '<option value="' + sanitize(l) + '">'; }).join(''));
}

/* ═══════════════════════════════════════════════
   Collaborators datalist
═══════════════════════════════════════════════ */
function initCollabsDatalist() {
  var seen = {};
  $.each(state.chronicle.itemListElement || [], function (_, e) {
    $.each(e.collaborators || [], function (_, c) { if (c) { seen[c] = true; } });
  });
  $('#collabs-datalist').html($.map(Object.keys(seen), function (c) { return '<option value="' + sanitize(c) + '">'; }).join(''));
}

/* ═══════════════════════════════════════════════
   Boot
═══════════════════════════════════════════════ */
$(function () {
  $.get('/api/all', function (data) {
    state.chronicle = data.chronicle || {};
    state.links     = data.links     || {};
    state.tags      = data.tags      || {};
    initLocDatalist();
    initCollabsDatalist();
    refreshChronikFilters();
    refreshLinksFilter();
    renderChronikTable();
    renderLinksTab();
    renderTagsTab();
  }).fail(function () { showToast('Fehler beim Laden der Config-Dateien.', false); });

  $.get('/api/albums', function (albums) {
    state.albums = albums || [];
    renderAlbenList();
  });

  $.get('/api/downloads', function (list) {
    state.downloads = list || [];
    renderDownloadsList();
  });

  $('.chip-container').each(function () { initChipInput($(this)); });
  initChronikFilters();
  initEntryModal();
  initLinkModal();
  initTagsTab();
  initVerlauf();
  initAlbenTab();
  initDownloadsTab();
  initLinksFilter();
  initImagePicker();

  $('#theme-toggle').on('click', function () {
    var $html = $('html');
    var next = $html.attr('data-theme') === 'dark' ? 'light' : 'dark';
    $html.attr({ 'data-theme': next, 'data-bs-theme': next });
  });

  // Delegated handlers for dynamically rendered content
  $('#chronik-tbody')
    .on('click', '.btn-edit-entry', function () { openEntryModal($(this).data('id')); })
    .on('click', '.btn-delete-entry', function () { deleteEntry($(this).data('id')); });

  $('#links-tbody')
    .on('click', '.btn-edit-link', function () { openLinkModal($(this).data('id')); })
    .on('click', '.btn-delete-link', function () { deleteLink($(this).data('id')); });

  $('#location-tags-list, #description-tags-list')
    .on('click', '.btn-delete-tag', function () { deleteTag($(this).data('group'), $(this).data('key')); });

  $('#verlauf-tbody')
    .on('click', '.btn-undo-entry', function () { undoEntry($(this).data('entry')); });

  $('#alben-filter-top').on('change', function () { renderAlbenList(); });

  $('#alben-list')
    .on('click', '.album-item', function (e) { e.preventDefault(); openAlbumForm($(this).attr('data-path')); });

  lucide.createIcons();
});

/* ═══════════════════════════════════════════════
   Chronik table
═══════════════════════════════════════════════ */
var chronikSearch = '', chronikFilterOrt = '', chronikFilterTag = '';

function initChronikFilters() {
  $('#chronik-search').on('input', function () {
    chronikSearch = $(this).val().toLowerCase();
    renderChronikTable();
  });
  $('#chronik-filter-ort').on('change', function () {
    chronikFilterOrt = $(this).val();
    renderChronikTable();
  });
  $('#chronik-filter-tag').on('change', function () {
    chronikFilterTag = $(this).val();
    renderChronikTable();
  });
}

function refreshChronikFilters() {
  var locs = [], tags = [];
  $.each(state.chronicle.itemListElement || [], function (_, e) {
    if (e.location && locs.indexOf(e.location) === -1) { locs.push(e.location); }
    $.each(e.tags || [], function (_, t) { if (tags.indexOf(t) === -1) { tags.push(t); } });
  });
  locs.sort(); tags.sort();
  var $ortSel = $('#chronik-filter-ort'), curOrt = $ortSel.val();
  $ortSel.html('<option value="">Alle Orte</option>'
    + $.map(locs, function (l) { return '<option value="' + sanitize(l) + '">' + sanitize(l) + '</option>'; }).join(''));
  if (curOrt) { $ortSel.val(curOrt); }
  var $tagSel = $('#chronik-filter-tag'), curTag = $tagSel.val();
  $tagSel.html('<option value="">Alle Tags</option>'
    + $.map(tags, function (t) { return '<option value="' + sanitize(t) + '">' + sanitize(t) + '</option>'; }).join(''));
  if (curTag) { $tagSel.val(curTag); }
}

function chronikItems() {
  var items = (state.chronicle.itemListElement || []).slice();
  items.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
  return items.filter(function (e) {
    if (chronikSearch && (e.title || '').toLowerCase().indexOf(chronikSearch) === -1) { return false; }
    if (chronikFilterOrt && e.location !== chronikFilterOrt) { return false; }
    if (chronikFilterTag && (e.tags || []).indexOf(chronikFilterTag) === -1) { return false; }
    return true;
  });
}

function renderChronikTable() {
  var items = chronikItems();
  $('#chronik-count').text(items.length + ' Einträge');
  var rows = $.map(items, function (e) {
    var tags = $.map(e.tags || [], function (t) {
      return '<span class="badge me-1" style="background:rgba(var(--color-primary-rgb),.18);color:var(--color-primary);">' + sanitize(t) + '</span>';
    }).join('');
    return '<tr>'
      + '<td class="text-nowrap">' + sanitize(egFormatDate(e.date)) + '</td>'
      + '<td>' + sanitize(e.title || '') + '</td>'
      + '<td class="hide-sm">' + sanitize(e.location || '') + '</td>'
      + '<td class="hide-sm">' + tags + '</td>'
      + '<td class="text-end text-nowrap">'
      + '<button class="btn btn-sm btn-outline-secondary me-1 btn-edit-entry" data-id="' + sanitize(e['@id']) + '" aria-label="Bearbeiten"><i data-lucide="pencil" aria-hidden="true"></i></button>'
      + '<button class="btn btn-sm btn-outline-danger btn-delete-entry" data-id="' + sanitize(e['@id']) + '" aria-label="Löschen"><i data-lucide="trash-2" aria-hidden="true"></i></button>'
      + '</td></tr>';
  }).join('');
  $('#chronik-tbody').html(rows || '<tr><td colspan="5" class="text-muted text-center py-3">Keine Einträge.</td></tr>');
  lucide.createIcons();
}

function deleteEntry(id) {
  if (!confirm('Eintrag wirklich löschen?')) { return; }
  state.chronicle.itemListElement = $.grep(state.chronicle.itemListElement || [], function (e) { return e['@id'] !== id; });
  saveChronicle(function () { refreshChronikFilters(); renderChronikTable(); showToast('Eintrag gelöscht.', true); });
}

function saveChronicle(cb) {
  $.ajax({
    url: '/api/save/chronicle', type: 'POST', contentType: 'application/json',
    data: JSON.stringify(state.chronicle),
    success: function () { if (cb) { cb(); } },
    error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); }
  });
}

/* ═══════════════════════════════════════════════
   Chronik entry modal
═══════════════════════════════════════════════ */
function initEntryModal() {
  $('#btn-new-entry').on('click', function () { openEntryModal(null); });
  $('#btn-save-entry').on('click', function () { saveEntryFromModal(); });
  $('#btn-ef-new-link').on('click', function () {
    $('#ef-new-link-form').toggleClass('d-none');
    if (!$('#ef-new-link-form').hasClass('d-none')) { $('#ef-nl-title').trigger('focus'); }
  });
  $('#btn-ef-nl-cancel').on('click', function () { $('#ef-new-link-form').addClass('d-none'); });
  $('#btn-ef-nl-save').on('click', function () { saveInlineNewLink(); });
  $('#ef-link-search').on('input', function () { renderLinkSuggestions($(this).val()); });
  $('#ef-link-suggestions').on('click', '.ef-link-suggestion', function () {
    addLinkIdChip($(this).attr('data-id'));
    $('#ef-link-search').val('');
    $('#ef-link-suggestions').empty();
  });
}

function openEntryModal(id) {
  var entry = id ? $.grep(state.chronicle.itemListElement || [], function (e) { return e['@id'] === id; })[0] : null;
  $('#ef-id').val(entry ? entry['@id'] : 'urn:uuid:' + crypto.randomUUID());
  $('#ef-title').val(entry ? (entry.title || '') : '');
  $('#ef-date').val(entry ? (entry.date || '') : '');
  $('#ef-location').val(entry ? (entry.location || '') : '');
  $('#ef-desc').val(entry ? (entry.description || '') : '');
  $('#entry-modal-label').text(entry ? 'Eintrag bearbeiten' : 'Neuer Eintrag');
  $('#entry-save-msg').text('');

  var $collabs = $('#ef-collabs-chips');
  clearChips($collabs);
  $.each(entry && entry.collaborators || [], function (_, c) { addChip($collabs, c); });

  buildTagsMenu($('#ef-tags-menu'), $('#ef-tags-badges'), $('#ef-tags-btn'), entry ? (entry.tags || []) : []);

  $('#ef-link-ids').empty();
  $.each(entry && entry.link_ids || [], function (_, id) { addLinkIdChip(id); });
  $('#ef-link-search').val('');
  $('#ef-link-suggestions').empty();
  $('#ef-new-link-form').addClass('d-none');

  new bootstrap.Modal($('#entry-modal')[0]).show();
}

function addLinkIdChip(id) {
  if ($('#ef-link-ids .ef-link-chip[data-id="' + id.replace(/"/g, '\\"') + '"]').length) { return; }
  var link = linkById(id);
  var label = link ? (linkLabel(link) || id) : id;
  var $chip = $('<span>')
    .addClass('badge ef-link-chip d-inline-flex align-items-center gap-1 me-1 mb-1')
    .css({ background: 'rgba(var(--color-primary-rgb),.18)', color: 'var(--color-primary)' })
    .attr('data-id', id)
    .text(label);
  var $rm = $('<button type="button" aria-label="Entfernen" style="font-size:.6rem;opacity:.6;background:none;border:none;padding:0;line-height:1;">&times;</button>');
  $rm.on('click', function () { $chip.remove(); });
  $chip.append($rm);
  $('#ef-link-ids').append($chip);
}

function renderLinkSuggestions(query) {
  var $box = $('#ef-link-suggestions');
  if (!query || query.length < 2) { $box.empty(); return; }
  var q = query.toLowerCase();
  var existing = $('#ef-link-ids .ef-link-chip').map(function () { return $(this).attr('data-id'); }).get();
  var matches = $.grep(state.links.itemListElement || [], function (li) {
    var it = li.item || {};
    if (!it['@id']) { return false; }
    if (existing.indexOf(it['@id']) !== -1) { return false; }
    return (it.title || '').toLowerCase().indexOf(q) !== -1 || (it.url || '').toLowerCase().indexOf(q) !== -1;
  });
  if (!matches.length) {
    $box.html('<div class="list-group-item list-group-item-action disabled small text-muted">Keine Treffer</div>');
    return;
  }
  $box.html($.map(matches.slice(0, 8), function (li) {
    var it = li.item;
    return '<button type="button" class="list-group-item list-group-item-action ef-link-suggestion small" data-id="' + sanitize(it['@id']) + '">'
      + '<span class="fw-semibold">' + sanitize(it.title || '') + '</span>'
      + ' <small class="text-muted">' + sanitize(it.url || '') + '</small>'
      + '</button>';
  }).join(''));
}

function saveInlineNewLink() {
  var title = $('#ef-nl-title').val().trim();
  var url   = $('#ef-nl-url').val().trim();
  var type  = $('#ef-nl-type').val();
  if (!title || !url) { showToast('Titel und URL sind Pflicht.', false); return; }
  var items = state.links.itemListElement || [];
  var urlLower = url.toLowerCase();
  var existing = null;
  $.each(items, function (_, li) {
    if (li.item && (li.item.url || '').toLowerCase() === urlLower) { existing = li.item; return false; }
  });
  if (existing) {
    showToast('URL bereits vorhanden - Link verknüpft: ' + (existing.title || url), true);
    addLinkIdChip(existing['@id']);
    $('#ef-new-link-form').addClass('d-none');
    $('#ef-nl-title, #ef-nl-url').val('');
    return;
  }
  var newId = 'urn:uuid:' + crypto.randomUUID();
  items.push({ '@type': 'ListItem', item: { '@id': newId, title: title, url: url, type: type } });
  state.links.itemListElement = items;
  saveLinks(function () {
    addLinkIdChip(newId);
    refreshLinksFilter();
    renderLinksTab();
    showToast('Link angelegt und verknüpft.', true);
  });
  $('#ef-new-link-form').addClass('d-none');
  $('#ef-nl-title, #ef-nl-url').val('');
}

function saveEntryFromModal() {
  var title = $('#ef-title').val().trim();
  var date  = $('#ef-date').val().trim();
  if (!title || !date) { $('#entry-save-msg').text('Titel und Datum sind Pflicht.'); return; }
  var entry = { '@type': 'Event', '@id': $('#ef-id').val(), title: title, date: date };
  var loc = $('#ef-location').val().trim();
  if (loc) { entry.location = loc; }
  var tags = getSelectedTags($('#ef-tags-menu'));
  if (tags.length) { entry.tags = tags; }
  var collabs = chipContainerValues($('#ef-collabs-chips'));
  if (collabs.length) { entry.collaborators = collabs; }
  var desc = $('#ef-desc').val().trim();
  if (desc) { entry.description = desc; }
  var linkIds = $('#ef-link-ids .ef-link-chip').map(function () { return $(this).attr('data-id'); }).get();
  if (linkIds.length) { entry.link_ids = linkIds; }

  var items = state.chronicle.itemListElement || [];
  var idx = -1;
  $.each(items, function (i, e) { if (e['@id'] === entry['@id']) { idx = i; return false; } });
  if (idx !== -1) { items[idx] = entry; } else { items.unshift(entry); }
  state.chronicle.itemListElement = items;

  saveChronicle(function () {
    bootstrap.Modal.getInstance($('#entry-modal')[0]).hide();
    initLocDatalist();
    initCollabsDatalist();
    refreshChronikFilters();
    renderChronikTable();
    showToast('Gespeichert.', true);
  });
}

/* ═══════════════════════════════════════════════
   Verlauf
═══════════════════════════════════════════════ */
function initVerlauf() {
  $('#verlauf-body').on('show.bs.collapse', function () { loadVerlauf(); });
}

function loadVerlauf() {
  $.get('/api/log/chronicle', function (entries) {
    var rows = $.map(entries || [], function (e) {
      var badge = { create:'primary', delete:'danger', undo:'warning', edit:'secondary' }[e.action] || 'secondary';
      var title = (e.before && e.before.title) || (e.after && e.after.title) || e.id || '';
      return '<tr>'
        + '<td class="verlauf-ts">' + sanitize(e.ts || '') + '</td>'
        + '<td class="verlauf-action"><span class="badge text-bg-' + badge + '">' + sanitize(e.action) + '</span></td>'
        + '<td>' + sanitize(title) + '</td>'
        + '<td><button class="btn btn-sm btn-outline-secondary py-0 btn-undo-entry" data-entry=\'' + JSON.stringify(e).replace(/'/g,'&#39;') + '\'>Wiederherstellen</button></td>'
        + '</tr>';
    }).join('');
    $('#verlauf-tbody').html(rows || '<tr><td colspan="4" class="text-muted text-center py-2">Kein Verlauf.</td></tr>');
  });
}

function undoEntry(logEntry) {
  if (!confirm('Eintrag auf diesen Zustand zurücksetzen?')) { return; }
  $.ajax({
    url: '/api/undo', type: 'POST', contentType: 'application/json',
    data: JSON.stringify({ file: 'chronicle', id: logEntry.id, before: logEntry.before, after: logEntry.after }),
    success: function (resp) {
      state.chronicle = resp.data || state.chronicle;
      renderChronikTable();
      loadVerlauf();
      showToast('Wiederhergestellt.', true);
    },
    error: function () { showToast('Fehler beim Wiederherstellen.', false); }
  });
}

/* ═══════════════════════════════════════════════
   Links tab
═══════════════════════════════════════════════ */
var linksFilterCat = '';

function initLinksFilter() {
  $('#links-filter-cat').on('change', function () {
    linksFilterCat = $(this).val();
    renderLinksTab();
  });
}

function refreshLinksFilter() {
  var cats = [];
  $.each(state.links.itemListElement || [], function (_, li) {
    var cat = (li.item || {}).type || '';
    if (cat && cats.indexOf(cat) === -1) { cats.push(cat); }
  });
  cats.sort();
  var $sel = $('#links-filter-cat'), cur = $sel.val();
  $sel.html('<option value="">Alle Kategorien</option>'
    + $.map(cats, function (c) { return '<option value="' + sanitize(c) + '">' + sanitize(c) + '</option>'; }).join(''));
  if (cur) { $sel.val(cur); }
}

function renderLinksTab() {
  var all = state.links.itemListElement || [];
  var items = linksFilterCat
    ? $.grep(all, function (li) { return (li.item || {}).type === linksFilterCat; })
    : all;
  $('#links-count').text(linksFilterCat ? items.length + ' / ' + all.length + ' Links' : items.length + ' Links');
  var rows = $.map(items, function (li) {
    var it = li.item || {};
    var id = it['@id'] || '';
    return '<tr>'
      + '<td><strong>' + sanitize(it.title || '') + '</strong>'
      + (it.description ? '<br><small class="text-muted">' + sanitize(it.description) + '</small>' : '')
      + '</td>'
      + '<td class="hide-sm"><a href="' + sanitize(it.url || '') + '" target="_blank" rel="noopener noreferrer" class="text-truncate d-block" style="max-width:260px;">' + sanitize(it.url || '') + '</a></td>'
      + '<td class="hide-sm"><span class="badge bg-secondary">' + sanitize(it.type || '') + '</span></td>'
      + '<td class="text-end text-nowrap">'
      + '<button class="btn btn-sm btn-outline-secondary me-1 btn-edit-link" data-id="' + sanitize(id) + '" aria-label="Bearbeiten"><i data-lucide="pencil" aria-hidden="true"></i></button>'
      + '<button class="btn btn-sm btn-outline-danger btn-delete-link" data-id="' + sanitize(id) + '" aria-label="Löschen"><i data-lucide="trash-2" aria-hidden="true"></i></button>'
      + '</td></tr>';
  }).join('');
  $('#links-tbody').html(rows || '<tr><td colspan="4" class="text-muted text-center py-3">Keine Links.</td></tr>');
  lucide.createIcons();
}

function deleteLink(id) {
  if (!confirm('Link wirklich löschen?')) { return; }
  state.links.itemListElement = $.grep(state.links.itemListElement || [], function (li) {
    return !(li.item && li.item['@id'] === id);
  });
  saveLinks(function () { refreshLinksFilter(); renderLinksTab(); showToast('Link gelöscht.', true); });
}

function saveLinks(cb) {
  $.ajax({
    url: '/api/save/links', type: 'POST', contentType: 'application/json',
    data: JSON.stringify(state.links),
    success: function () { if (cb) { cb(); } },
    error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); }
  });
}

/* ═══════════════════════════════════════════════
   Link modal
═══════════════════════════════════════════════ */
function initLinkModal() {
  $('#btn-new-link').on('click', function () { openLinkModal(null); });
  $('#btn-save-link').on('click', function () { saveLinkFromModal(); });
  $('#lm-type').on('change', function () {
    $('#lm-api-fields').toggleClass('d-none', $(this).val() !== 'api');
  });
}

function openLinkModal(id) {
  currentLinkId = id || null;
  var li = id ? $.grep(state.links.itemListElement || [], function (l) { return l.item && l.item['@id'] === id; })[0] : null;
  var it = li ? (li.item || {}) : {};
  $('#lm-title').val(it.title       || '');
  $('#lm-url').val(it.url           || '');
  $('#lm-desc').val(it.description  || '');
  $('#lm-type').val(it.type         || 'extern');
  $('#lm-method').val(it.httpMethod  || '');
  $('#lm-encoding').val(it.encodingType || '');
  $('#lm-api-fields').toggleClass('d-none', (it.type || '') !== 'api');
  $('#link-modal-label').text(li ? 'Link bearbeiten' : 'Neuer Link');
  $('#link-save-msg').text('');
  new bootstrap.Modal($('#link-modal')[0]).show();
}

function saveLinkFromModal() {
  var title = $('#lm-title').val().trim();
  var url   = $('#lm-url').val().trim();
  if (!title || !url) { $('#link-save-msg').text('Titel und URL sind Pflicht.'); return; }
  var type = $('#lm-type').val();
  var items = state.links.itemListElement || [];

  // Duplicate URL check (only for new links)
  if (!currentLinkId) {
    var urlLower = url.toLowerCase();
    var dup = null;
    $.each(items, function (_, li) {
      if ((li.item && li.item.url || '').toLowerCase() === urlLower) { dup = li.item; return false; }
    });
    if (dup) {
      $('#link-save-msg').text('URL existiert bereits: ' + (dup.title || url));
      return;
    }
  }

  var it = { url: url, title: title, type: type };
  var desc = $('#lm-desc').val().trim();
  if (desc) { it.description = desc; }
  if (type === 'api') {
    var method = $('#lm-method').val().trim();
    var enc    = $('#lm-encoding').val().trim();
    if (method) { it.httpMethod = method; }
    if (enc)    { it.encodingType = enc; }
  }
  if (currentLinkId) {
    var idx = -1;
    $.each(items, function (i, li) { if (li.item && li.item['@id'] === currentLinkId) { idx = i; return false; } });
    if (idx !== -1) {
      it['@id'] = currentLinkId;
      items[idx].item = it;
    }
  } else {
    it['@id'] = 'urn:uuid:' + crypto.randomUUID();
    items.push({ '@type': 'ListItem', item: it });
  }
  state.links.itemListElement = items;
  saveLinks(function () {
    bootstrap.Modal.getInstance($('#link-modal')[0]).hide();
    refreshLinksFilter();
    renderLinksTab();
    if (currentLinkId) {
      var saved = linkById(currentLinkId);
      if (saved) {
        var newLabel = sanitize(linkLabel(saved));
        $('#dl-parts-body .dl-link-chip').filter(function () {
          return $(this).attr('data-id') === currentLinkId;
        }).each(function () {
          $(this).html(newLabel + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1 dl-link-chip-remove" aria-label="Link entfernen"></button>');
        });
      }
    }
    showToast('Gespeichert.', true);
  });
}

/* ═══════════════════════════════════════════════
   Tags tab
═══════════════════════════════════════════════ */
function renderTagsTab() {
  renderTagGroup('location-tags-list', state.tags.location_tags || {}, 'location', function (key, val) {
    return '<span class="text-muted small">' + sanitize(val.location || '') + '</span>';
  });
  renderTagGroup('description-tags-list', state.tags.description_tags || {}, 'description', function (key, val) {
    return '<span class="text-muted small" style="max-width:260px;display:inline-block;">' + sanitize((val.description || '').substring(0, 80)) + (val.description && val.description.length > 80 ? '…' : '') + '</span>';
  });
}

function renderTagGroup(containerId, tagsObj, groupKey, extraHtml) {
  var html = $.map(Object.entries(tagsObj), function (kv) {
    var key = kv[0], val = kv[1];
    return '<div class="tag-card d-flex justify-content-between align-items-start gap-2">'
      + '<div>'
      + '<code class="me-2" style="color:var(--color-primary);">' + sanitize(key) + '</code>'
      + '<strong>' + sanitize(val.label || '') + '</strong>'
      + '<br>' + extraHtml(key, val)
      + '</div>'
      + '<button class="btn btn-sm btn-outline-danger flex-shrink-0 btn-delete-tag" data-group="' + groupKey + '" data-key="' + sanitize(key) + '" aria-label="Tag löschen">'
      + '<i data-lucide="trash-2" aria-hidden="true"></i></button>'
      + '</div>';
  }).join('');
  $('#' + containerId).html(html || '<p class="text-muted small">Keine Einträge.</p>');
  lucide.createIcons();
}

function deleteTag(group, key) {
  if (!confirm('Tag "' + key + '" löschen?')) { return; }
  var groupKey = group === 'location' ? 'location_tags' : 'description_tags';
  if (state.tags[groupKey]) { delete state.tags[groupKey][key]; }
  renderTagsTab();
}

function initTagsTab() {
  $('#btn-add-loc-tag').on('click', function () {
    var key   = $('#new-loc-key').val().trim().replace(/^#+/, '');
    var label = $('#new-loc-label').val().trim();
    var loc   = $('#new-loc-location').val().trim();
    if (!key || !label) { showToast('Schlüssel und Label sind Pflicht.', false); return; }
    if (!state.tags.location_tags) { state.tags.location_tags = {}; }
    state.tags.location_tags[key] = { '@type': 'Place', label: label, location: loc };
    $('#new-loc-key, #new-loc-label, #new-loc-location').val('');
    renderTagsTab();
  });
  $('#btn-add-desc-tag').on('click', function () {
    var key   = $('#new-desc-key').val().trim().replace(/^#+/, '');
    var label = $('#new-desc-label').val().trim();
    var desc  = $('#new-desc-desc').val().trim();
    if (!key || !label) { showToast('Schlüssel und Label sind Pflicht.', false); return; }
    if (!state.tags.description_tags) { state.tags.description_tags = {}; }
    state.tags.description_tags[key] = { '@type': 'DefinedTerm', label: label, description: desc };
    $('#new-desc-key, #new-desc-label, #new-desc-desc').val('');
    renderTagsTab();
  });
  $('#btn-save-tags').on('click', function () {
    $.ajax({
      url: '/api/save/tags', type: 'POST', contentType: 'application/json',
      data: JSON.stringify(state.tags),
      success: function () {
        $('#tags-save-msg').text('Gespeichert.');
        showToast('Tags gespeichert.', true);
        buildTagsMenu($('#ef-tags-menu'), $('#ef-tags-badges'), $('#ef-tags-btn'), []);
      },
      error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); }
    });
  });
}

/* ═══════════════════════════════════════════════
   Image picker
═══════════════════════════════════════════════ */
function initImagePicker() {
  $('#btn-preview-pick').on('click', function () { openImagePicker('preview'); });
  $('#btn-blur-pick').on('click', function () { openImagePicker('blur'); });
  $('#btn-noblur-pick').on('click', function () { openImagePicker('noblur'); });

  $('#image-picker-grid').on('click', '.img-thumb-wrap', function () {
    if (imagePickerMode === 'preview') {
      $('#alb-preview').val($(this).attr('data-file'));
      bootstrap.Modal.getInstance($('#image-picker-modal')[0]).hide();
    } else {
      $(this).toggleClass('selected');
      updateImagePickerCount();
    }
  });

  $('#btn-image-picker-confirm').on('click', function () {
    var files = $('#image-picker-grid .img-thumb-wrap.selected').map(function () {
      return $(this).attr('data-file');
    }).get();
    var $target = imagePickerMode === 'blur' ? $('#alb-blur-chips') : $('#alb-noblur-chips');
    clearChips($target);
    $.each(files, function (_, f) { addChip($target, f); });
    bootstrap.Modal.getInstance($('#image-picker-modal')[0]).hide();
  });
}

function updateImagePickerCount() {
  var n = $('#image-picker-grid .img-thumb-wrap.selected').length;
  $('#image-picker-count').text(n ? n + ' ausgewählt' : '');
}

function openImagePicker(mode) {
  if (!currentAlbumPath) { return; }
  imagePickerMode = mode;

  var titles = { preview: 'Vorschau wählen', blur: 'Blur-Bilder wählen', noblur: 'No-Blur-Bilder wählen' };
  $('#image-picker-label').text(titles[mode]);
  $('#image-picker-footer').toggleClass('d-none', mode === 'preview');
  $('#image-picker-grid').html('<span class="text-muted small">Lade Bilder…</span>');
  $('#image-picker-count').text('');
  new bootstrap.Modal($('#image-picker-modal')[0]).show();

  var preSelected = [];
  if (mode === 'preview') {
    var v = $('#alb-preview').val().trim();
    if (v) { preSelected = [v]; }
  } else if (mode === 'blur') {
    preSelected = chipContainerValues($('#alb-blur-chips'));
  } else {
    preSelected = chipContainerValues($('#alb-noblur-chips'));
  }

  $.get('/api/album/images?path=' + encodeURIComponent(currentAlbumPath), function (files) {
    if (!files || !files.length) {
      $('#image-picker-grid').html('<p class="text-muted small">Keine Bilder gefunden.</p>');
      return;
    }
    var html = $.map(files, function (f) {
      var sel = preSelected.indexOf(f) !== -1;
      var imgUrl = '/api/album/image?path=' + encodeURIComponent(currentAlbumPath) + '&file=' + encodeURIComponent(f);
      return '<div class="img-thumb-wrap' + (sel ? ' selected' : '') + '" data-file="' + sanitize(f) + '">'
        + '<img src="' + sanitize(imgUrl) + '" class="img-thumb" alt="' + sanitize(f) + '" loading="lazy">'
        + '<div class="img-thumb-label" title="' + sanitize(f) + '">' + sanitize(f) + '</div>'
        + '</div>';
    }).join('');
    $('#image-picker-grid').html(html);
    updateImagePickerCount();
  }).fail(function () {
    $('#image-picker-grid').html('<p class="text-danger small">Fehler beim Laden der Bilder.</p>');
  });
}

/* ═══════════════════════════════════════════════
   Alben tab
═══════════════════════════════════════════════ */
function initAlbenTab() {
  $('#btn-alben-back').on('click', function () {
    $('#alben-form-view').addClass('d-none');
    $('#alben-list-view').removeClass('d-none');
    $('#alb-chronicle-info').addClass('d-none');
    currentAlbumPath = null;
  });

  $('#alb-chronicle').on('change', function () { renderChronicleInfo($(this).val()); });

  $('#alb-chronicle-info').on('click', '#btn-edit-chronicle-from-album', function () {
    openEntryModal($('#alb-chronicle').val());
  });

  $('#entry-modal').on('hidden.bs.modal', function () {
    if (!currentAlbumPath) { return; }
    var id = $('#alb-chronicle').val();
    buildChronicleDropdown($('#alb-chronicle'), id);
    renderChronicleInfo(id);
  });

  $('#alben-form').on('submit', function (ev) {
    ev.preventDefault();
    if (!currentAlbumPath) { return; }
    var title = $('#alb-title').val().trim();
    if (!title) { $('#alb-save-msg').text('Titel ist Pflicht.'); return; }
    var cfg = { title: title, consent_collected: $('#alb-consent').prop('checked') };
    var date = $('#alb-date').val();
    if (date) { cfg.date = date; }
    var desc = $('#alb-desc').val().trim();
    if (desc) { cfg.description = desc; }
    var preview = $('#alb-preview').val().trim();
    if (preview) { cfg.preview = preview; }
    var cid = $('#alb-chronicle').val();
    if (cid) { cfg.chronicle_id = cid; }
    var tags = getSelectedTags($('#alb-tags-menu'));
    if (tags.length) { cfg.tags = tags; }
    var blur   = chipContainerValues($('#alb-blur-chips'));
    var noblur = chipContainerValues($('#alb-noblur-chips'));
    if (blur.length)   { cfg.blur    = blur; }
    if (noblur.length) { cfg.no_blur = noblur; }
    $.ajax({
      url: '/api/album?path=' + encodeURIComponent(currentAlbumPath), type: 'POST', contentType: 'application/json',
      data: JSON.stringify(cfg),
      success: function () {
        showToast('Album gespeichert. Bitte process.py ausfuehren.', true);
        $.get('/api/albums', function (albums) {
          state.albums = albums || [];
          renderAlbenList();
          $('#alben-form-view').addClass('d-none');
          $('#alben-list-view').removeClass('d-none');
          currentAlbumPath = null;
        });
      },
      error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); }
    });
  });
}

function renderAlbenList() {
  var $list   = $('#alben-list');
  var $empty  = $('#alben-empty');
  var $filter = $('#alben-filter-top');
  var selected = $filter.val() || '';

  // Rebuild top-level path options when state changed
  var tops = {};
  $.each(state.albums || [], function (_, a) {
    var top = (a.path || '').split('/')[0];
    if (top) { tops[top] = true; }
  });
  var sortedTops = Object.keys(tops).sort();
  var current = $filter.find('option[value!=""]').map(function () { return $(this).val(); }).get().sort().join(',');
  if (current !== sortedTops.join(',')) {
    $filter.find('option[value!=""]').remove();
    $.each(sortedTops, function (_, top) {
      $filter.append('<option value="' + sanitize(top) + '">' + sanitize(top) + '</option>');
    });
    $filter.val(tops[selected] ? selected : '');
    selected = $filter.val() || '';
  }

  var filtered = $.grep(state.albums || [], function (a) {
    return !selected || (a.path || '').split('/')[0] === selected;
  });

  $('#alben-count').text(filtered.length + ' Album' + (filtered.length !== 1 ? 'en' : ''));

  if (!filtered.length) {
    $list.empty();
    $empty.removeClass('d-none');
    return;
  }
  $empty.addClass('d-none');
  $list.html($.map(filtered, function (a) {
    return '<a href="#" class="list-group-item list-group-item-action album-item d-flex justify-content-between align-items-center" data-path="' + sanitize(a.path) + '">'
      + '<span>' + sanitize(a.title) + '</span>'
      + '<small class="text-muted">' + sanitize(a.path) + '</small></a>';
  }).join(''));
}

function renderChronicleInfo(id) {
  var $wrap = $('#alb-chronicle-info');
  if (!id) { $wrap.addClass('d-none'); return; }
  var entry = $.grep(state.chronicle.itemListElement || [], function (e) { return e['@id'] === id; })[0];
  if (!entry) { $wrap.addClass('d-none'); return; }

  var tagsHtml = $.map(entry.tags || [], function (t) {
    return '<span class="badge me-1" style="background:rgba(var(--color-primary-rgb),.18);color:var(--color-primary);">' + sanitize(t) + '</span>';
  }).join('');
  var collabsHtml = $.map(entry.collaborators || [], function (c) {
    return '<span class="badge bg-secondary me-1">' + sanitize(c) + '</span>';
  }).join('');
  var linksHtml = $.map(entry.link_ids || [], function (lid) {
    var l = linkById(lid);
    if (!l || !l.url) { return ''; }
    return '<a href="' + sanitize(l.url) + '" target="_blank" rel="noopener noreferrer" class="badge bg-secondary text-decoration-none me-1">'
      + sanitize(l.title || l.url) + ' <small>(' + sanitize(l.type || '') + ')</small></a>';
  }).join('');

  var rows = [];
  if (entry.date)        { rows.push(['Datum', sanitize(egFormatDate(entry.date))]); }
  if (entry.location)    { rows.push(['Ort', sanitize(entry.location)]); }
  if (tagsHtml)          { rows.push(['Tags', tagsHtml]); }
  if (collabsHtml)       { rows.push(['Kollaborateure', collabsHtml]); }
  if (entry.description) { rows.push(['Beschreibung', sanitize(entry.description)]); }
  if (linksHtml)         { rows.push(['Links', linksHtml]); }

  var html = '<div class="d-flex justify-content-between align-items-center mb-2">'
    + '<strong class="small">' + sanitize(entry.title || '') + '</strong>'
    + '<button type="button" id="btn-edit-chronicle-from-album" class="btn btn-sm btn-outline-secondary py-0">'
    + '<i data-lucide="pencil" aria-hidden="true"></i> Bearbeiten</button>'
    + '</div>'
    + '<dl class="row g-0 mb-0 small">'
    + $.map(rows, function (r) {
      return '<dt class="col-sm-3 text-muted fw-normal">' + r[0] + '</dt><dd class="col-sm-9 mb-1">' + r[1] + '</dd>';
    }).join('')
    + '</dl>';

  $('#alb-chronicle-info-body').html(html);
  $wrap.removeClass('d-none');
  lucide.createIcons();
}

function buildChronicleDropdown($selectEl, selectedId) {
  var items = (state.chronicle.itemListElement || []).slice();
  items.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
  $selectEl.html('<option value="">– kein –</option>'
    + $.map(items, function (e) {
      return '<option value="' + sanitize(e['@id']) + '"' + (e['@id'] === selectedId ? ' selected' : '') + '>'
        + sanitize(egFormatDate(e.date) + ' - ' + (e.title || e['@id'])) + '</option>';
    }).join(''));
}

function openAlbumForm(path) {
  currentAlbumPath = path;
  $('#alben-form-title').text(path);
  $('#alb-save-msg').text('');
  $.get('/api/album?path=' + encodeURIComponent(path), function (cfg) {
    $('#alb-title').val(cfg.title || '');
    $('#alb-date').val(cfg.date  || '');
    $('#alb-desc').val(cfg.description || '');
    $('#alb-consent').prop('checked', !!cfg.consent_collected);
    $('#alb-preview').val(cfg.preview || '');
    buildChronicleDropdown($('#alb-chronicle'), cfg.chronicle_id || '');
    renderChronicleInfo(cfg.chronicle_id || '');
    buildTagsMenu($('#alb-tags-menu'), $('#alb-tags-badges'), $('#alb-tags-btn'), cfg.tags || []);
    clearChips($('#alb-blur-chips'));
    $.each(cfg.blur || [], function (_, f) { addChip($('#alb-blur-chips'), f); });
    clearChips($('#alb-noblur-chips'));
    $.each(cfg.no_blur || [], function (_, f) { addChip($('#alb-noblur-chips'), f); });
    $('#alben-list-view').addClass('d-none');
    $('#alben-form-view').removeClass('d-none');
    lucide.createIcons();
  }).fail(function (xhr) {
    var err = (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : ('HTTP ' + xhr.status);
    showToast('Album laden fehlgeschlagen: ' + err, false);
  });
}

/* ═══════════════════════════════════════════════
   Downloads tab
═══════════════════════════════════════════════ */
function renderDownloadsList() {
  var $list  = $('#dl-list');
  var $empty = $('#dl-empty');
  if (!state.downloads || state.downloads.length === 0) {
    $list.empty();
    $empty.removeClass('d-none');
    return;
  }
  $empty.addClass('d-none');
  $list.html($.map(state.downloads, function (d) {
    return '<a href="#" class="list-group-item list-group-item-action dl-folder-item d-flex justify-content-between align-items-center" data-path="' + sanitize(d.path) + '">'
      + '<span>' + sanitize(d.path) + '</span>'
      + (d.hasMeta ? '<span class="badge bg-secondary">_meta.json</span>' : '<span class="badge bg-light text-muted">leer</span>')
      + '</a>';
  }).join(''));
}

function initDlFixedDropdowns($scope) {
  $scope.find('[data-bs-toggle="dropdown"]').each(function () {
    new bootstrap.Dropdown(this, { popperConfig: { strategy: 'fixed' } });
  });
}

function renderDownloadParts(hasPart, availableFiles) {
  var $tbody = $('#dl-parts-body');
  $tbody.empty();
  $.each(hasPart || [], function (idx, part) {
    $tbody.append(buildPartRow(idx, part, availableFiles));
  });
  initDlFixedDropdowns($tbody);
  lucide.createIcons();
}

function buildPartRow(idx, part, availableFiles) {
  var linkChips = $.map(part.link_ids || [], function (lid) {
    var lnk = linkById(lid);
    var label = lnk ? sanitize(linkLabel(lnk) || lid) : sanitize(lid);
    return '<span class="badge bg-primary me-1 dl-link-chip" data-id="' + sanitize(lid) + '">' + label
      + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1 dl-link-chip-remove" aria-label="Link entfernen"></button></span>';
  }).join('');
  var tagBadges = $.map(part.tags || [], function (t) {
    return '<span class="badge bg-secondary me-1 dl-tag-chip" data-key="' + sanitize(t) + '">' + sanitize(t)
      + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1 dl-tag-chip-remove" aria-label="Tag entfernen"></button></span>';
  }).join('');

  return '<tr data-idx="' + idx + '">'
    + '<td><input type="text" class="form-control form-control-sm dl-part-title" value="' + sanitize(part.title || '') + '" placeholder="Dateiname" aria-label="Dateiname"></td>'
    + '<td><input type="text" class="form-control form-control-sm dl-part-desc" value="' + sanitize(part.description || '') + '" placeholder="Beschreibung"></td>'
    + '<td><div class="dl-part-links d-flex flex-wrap gap-1 align-items-center">'
    + linkChips
    + '<input type="text" class="form-control form-control-sm dl-link-search" placeholder="Link suchen..." style="max-width:140px;" autocomplete="off">'
    + '<ul class="dropdown-menu dl-link-suggestions p-1" style="font-size:.8rem;min-width:200px;"></ul>'
    + '</div></td>'
    + '<td><div class="dl-part-tags d-flex flex-wrap gap-1 align-items-center">'
    + tagBadges
    + '<div class="dropdown">'
    + '<button type="button" class="btn btn-outline-secondary btn-sm dropdown-toggle py-0 dl-tag-btn" data-bs-toggle="dropdown" aria-expanded="false">Tag</button>'
    + '<ul class="dropdown-menu p-2 dl-tag-menu" style="min-width:200px;max-height:200px;overflow-y:auto;"></ul>'
    + '</div></div></td>'
    + '<td><button type="button" class="btn btn-sm btn-outline-danger py-0 dl-part-delete" aria-label="Eintrag loeschen"><i data-lucide="trash-2" aria-hidden="true"></i></button></td>'
    + '</tr>';
}

function collectPartsFromTable() {
  var parts = [];
  $('#dl-parts-body tr').each(function () {
    var $row   = $(this);
    var title  = $row.find('.dl-part-title').val() || '';
    var desc   = $row.find('.dl-part-desc').val().trim();
    var linkIds = [];
    $row.find('.dl-link-chip').each(function () { linkIds.push($(this).attr('data-id')); });
    var tags = [];
    $row.find('.dl-tag-chip').each(function () { tags.push($(this).attr('data-key')); });
    if (title) {
      var part = { '@type': 'MediaObject', title: title, link_ids: linkIds, tags: tags };
      if (desc) { part.description = desc; }
      parts.push(part);
    }
  });
  return parts;
}

function initDownloadsTab() {
  $('#btn-dl-back').on('click', function () {
    $('#dl-form-view').addClass('d-none');
    $('#dl-list-view').removeClass('d-none');
    currentDownloadPath = null;
  });

  $('#dl-list').on('click', '.dl-folder-item', function (e) {
    e.preventDefault();
    openDownloadForm($(this).attr('data-path'));
  });

  $('#btn-dl-add-part').on('click', function () {
    var path = currentDownloadPath;
    if (!path) { return; }
    $.get('/api/download-files?path=' + encodeURIComponent(path), function (files) {
      var idx = $('#dl-parts-body tr').length;
      var $row = $(buildPartRow(idx, { title: '', description: '', link_ids: [], tags: [] }, files));
      $('#dl-parts-body').append($row);
      wirePartRow($row);
      initDlFixedDropdowns($row);
      lucide.createIcons();
    });
  });

  $('#dl-parts-body').on('click', '.dl-part-delete', function () {
    $(this).closest('tr').remove();
  });

  $('#dl-parts-body').on('click', '.dl-link-chip-remove', function (e) {
    e.stopPropagation();
    $(this).closest('.dl-link-chip').remove();
  });

  $('#dl-parts-body').on('click', '.dl-link-chip', function () {
    var id = $(this).attr('data-id');
    if (id) { openLinkModal(id); }
  });

  $('#dl-parts-body').on('click', '.dl-tag-chip-remove', function () {
    $(this).closest('.dl-tag-chip').remove();
  });

  $('#dl-parts-body').on('input', '.dl-link-search', function () {
    var $input = $(this);
    var $ul    = $input.siblings('.dl-link-suggestions');
    var query  = $input.val().trim().toLowerCase();
    if (!query) { $ul.removeClass('show').css({ top: '', left: '', width: '' }); return; }
    var existingIds = [];
    $input.closest('td').find('.dl-link-chip').each(function () { existingIds.push($(this).attr('data-id')); });
    var matches = [];
    $.each(state.links.itemListElement || [], function (_, li) {
      if (!li.item || !li.item['@id']) { return; }
      if (existingIds.indexOf(li.item['@id']) !== -1) { return; }
      if ((li.item.title || '').toLowerCase().indexOf(query) !== -1 || (li.item.url || '').toLowerCase().indexOf(query) !== -1) {
        matches.push(li.item);
      }
    });
    if (!matches.length) { $ul.removeClass('show').css({ top: '', left: '', width: '' }); return; }
    var rect = $input[0].getBoundingClientRect();
    $ul.html($.map(matches.slice(0, 8), function (lnk) {
      return '<li><a href="#" class="dropdown-item py-1 dl-link-suggestion-item" data-id="' + sanitize(lnk['@id']) + '">'
        + sanitize(linkLabel(lnk) || lnk.url) + '</a></li>';
    }).join('')).css({ top: rect.bottom + 'px', left: rect.left + 'px', width: Math.max(220, rect.width) + 'px' }).addClass('show');
  });

  $('#dl-parts-body').on('click', '.dl-link-suggestion-item', function (e) {
    e.preventDefault();
    var id    = $(this).attr('data-id');
    var $td   = $(this).closest('td');
    $td.find('.dl-link-suggestions').removeClass('show').css({ top: '', left: '', width: '' });
    $td.find('.dl-link-search').val('');
    var lnk   = linkById(id);
    var label = lnk ? sanitize(linkLabel(lnk) || id) : sanitize(id);
    var $chip = $('<span class="badge bg-primary me-1 dl-link-chip" data-id="' + sanitize(id) + '">'
      + label + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1 dl-link-chip-remove" aria-label="Link entfernen"></button></span>');
    $td.find('.dl-link-search').before($chip);
  });

  $('#dl-parts-body').on('show.bs.dropdown', '.dl-tag-btn', function () {
    var $menu = $(this).siblings('.dl-tag-menu');
    var existingKeys = [];
    $(this).closest('td').find('.dl-tag-chip').each(function () { existingKeys.push($(this).attr('data-key')); });
    var allTags = {};
    $.each(state.tags.location_tags || {}, function (k, v) { allTags[k] = v.label || k; });
    $.each(state.tags.description_tags || {}, function (k, v) { allTags[k] = v.label || k; });
    $menu.empty();
    $.each(allTags, function (key, label) {
      if (existingKeys.indexOf(key) !== -1) { return; }
      $menu.append('<li><a href="#" class="dropdown-item py-1 dl-tag-pick-item" data-key="' + sanitize(key) + '">' + sanitize(label) + '</a></li>');
    });
    if (!$menu.children().length) { $menu.append('<li><span class="dropdown-item text-muted">Keine weiteren Tags</span></li>'); }
  });

  $('#dl-parts-body').on('click', '.dl-tag-pick-item', function (e) {
    e.preventDefault();
    var key  = $(this).attr('data-key');
    var $td  = $(this).closest('td');
    var $chip = $('<span class="badge bg-secondary me-1 dl-tag-chip" data-key="' + sanitize(key) + '">' + sanitize(key)
      + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1 dl-tag-chip-remove" aria-label="Tag entfernen"></button></span>');
    $td.find('.dropdown').before($chip);
  });

  $('#dl-form').on('submit', function (ev) {
    ev.preventDefault();
    if (!currentDownloadPath) { return; }
    var meta = {
      '@context': 'https://schema.org',
      '@type':    'DataCatalog',
      '@id':      'https://share.erfindergeist.org/downloads/' + currentDownloadPath,
      'name':     currentDownloadPath.split('/').pop(),
      'description': $('#dl-description').val().trim(),
      'hasPart':  collectPartsFromTable(),
    };
    $.ajax({
      url: '/api/download-meta?path=' + encodeURIComponent(currentDownloadPath),
      type: 'POST', contentType: 'application/json',
      data: JSON.stringify(meta),
      success: function () {
        $('#dl-save-msg').text('Gespeichert.');
        showToast('_meta.json gespeichert.', true);
        $.get('/api/downloads', function (list) { state.downloads = list || []; renderDownloadsList(); });
      },
      error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); },
    });
  });
}

function wirePartRow($row) {
  // nothing extra needed — event delegation covers all .dl-* handlers
}

function openDownloadForm(path) {
  currentDownloadPath = path;
  $('#dl-form-title').text(path);
  $('#dl-save-msg').text('');
  $.get('/api/download-meta?path=' + encodeURIComponent(path), function (meta) {
    $('#dl-description').val(meta.description || '');
    $.get('/api/download-files?path=' + encodeURIComponent(path), function (files) {
      renderDownloadParts(meta.hasPart || [], files);
      $('#dl-list-view').addClass('d-none');
      $('#dl-form-view').removeClass('d-none');
      lucide.createIcons();
    });
  }).fail(function (xhr) {
    showToast('Download-Ordner laden fehlgeschlagen: ' + ((xhr.responseJSON && xhr.responseJSON.error) || xhr.status), false);
  });
}

