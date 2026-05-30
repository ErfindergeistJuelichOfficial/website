/* ═══════════════════════════════════════════════
   Global state
═══════════════════════════════════════════════ */
var state = { chronicle: {}, links: {}, tags: {}, albums: [], downloads: [] };
var currentAlbumPath = null;
var currentDownloadPath = null;
var currentDownloadFile = null;
var currentLinkId = null;
var imagePickerMode = null; // 'preview', 'blur', 'noblur'
var dlSearch = '', dlFilterBereich = '', dlFilterThema = '', dlFilterGruppe = '';
var KNOWN_BADGE_EXTS = { pdf:1, docx:1, xlsx:1, pptx:1, odt:1, ods:1, odp:1, odg:1, md:1 };

var LINK_TYPES = ['website','service','social','github','api','sponsoring','galerie','extern','blog','cloud','raw','wiki'];

var LINK_BUTTON_CLASS = {
  wiki:    'btn-outline-primary',
  raw:     'btn-outline-secondary',
  cloud:   'btn-outline-success',
  blog:    'btn-outline-secondary',
  github:  'btn-outline-secondary',
  website: 'btn-outline-primary',
  service: 'btn-outline-secondary',
  social:  'btn-outline-secondary',
  api:     'btn-outline-secondary',
  extern:  'btn-outline-secondary',
};

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

function normalizeDocsUrl(url) {
  // docs.erfindergeist.org/doc/... is the internal path — the public path requires /s/wiki/
  return url.replace(/^(https?:\/\/docs\.erfindergeist\.org\/)doc\//i, '$1s/wiki/doc/');
}

function inferLinkType(url) {
  if (/^https?:\/\/docs\.erfindergeist\.org\//i.test(url))  { return 'wiki'; }
  if (/^https?:\/\/cloud\.erfindergeist\.org\//i.test(url)) { return 'cloud'; }
  if (/^https?:\/\/erfindergeist\.org\//i.test(url))        { return 'website'; }
  return null;
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
   Tab routing (hash-based, like share)
═══════════════════════════════════════════════ */
var TAB_HASHES = {
  chronik:   '#tab-chronik-btn',
  links:     '#tab-links-btn',
  tags:      '#tab-tags-btn',
  alben:     '#tab-alben-btn',
  downloads: '#tab-downloads-btn',
};

function activateTabFromHash() {
  var hash = location.hash.replace('#', '');
  var sel  = (hash && TAB_HASHES[hash]) ? TAB_HASHES[hash] : TAB_HASHES.chronik;
  var el   = document.querySelector(sel);
  if (el) { bootstrap.Tab.getOrCreateInstance(el).show(); }
}

function initTabRouting() {
  activateTabFromHash();

  $('#main-tabs').on('shown.bs.tab', 'button[data-bs-toggle="tab"]', function () {
    var tabName = ($(this).data('bsTarget') || '').replace('#tab-', '');
    if (!tabName || tabName === 'chronik') {
      history.replaceState(null, '', location.pathname + location.search);
    } else {
      history.replaceState(null, '', '#' + tabName);
    }
  });

  $(window).on('popstate', activateTabFromHash);
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

  $.get('/api/download-entries', function (list) {
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
  initTabRouting();

  $('#theme-toggle').on('click', function () {
    var $html = $('html');
    var next = $html.attr('data-theme') === 'dark' ? 'light' : 'dark';
    $html.attr({ 'data-theme': next, 'data-bs-theme': next });
    localStorage.setItem('eg-theme', next);
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

  $('#alben-tbody')
    .on('click', '.album-title-link', function (e) { e.preventDefault(); openAlbumModal($(this).data('path')); })
    .on('click', '.btn-edit-album',   function () { openAlbumModal($(this).data('path')); })
    .on('click', '.btn-delete-album', function () { deleteAlbum($(this).data('path')); });

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
  $('#chronik-clear-filters').on('click', function () {
    chronikSearch = ''; chronikFilterOrt = ''; chronikFilterTag = '';
    $('#chronik-search').val('');
    $('#chronik-filter-ort').val('');
    $('#chronik-filter-tag').val('');
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
    var rawDesc = e.description || '';
    var descShort = rawDesc.length > 60 ? rawDesc.slice(0, 60) + '...' : rawDesc;
    var entryId = sanitize(e['@id']);
    return '<tr>'
      + '<td class="text-nowrap">' + sanitize(egFormatDate(e.date)) + '</td>'
      + '<td>' + sanitize(e.title || '') + '</td>'
      + '<td class="hide-sm text-muted small btn-edit-entry" data-id="' + entryId + '" style="cursor:pointer;" title="' + sanitize(rawDesc) + '">' + sanitize(descShort) + '</td>'
      + '<td class="hide-sm">' + sanitize(e.location || '') + '</td>'
      + '<td class="hide-sm">' + tags + '</td>'
      + '<td class="text-end text-nowrap">'
      + '<button class="btn btn-sm btn-outline-secondary me-1 btn-edit-entry" data-id="' + entryId + '" aria-label="Bearbeiten"><i data-lucide="pencil" aria-hidden="true"></i></button>'
      + '<button class="btn btn-sm btn-outline-danger btn-delete-entry" data-id="' + entryId + '" aria-label="Löschen"><i data-lucide="trash-2" aria-hidden="true"></i></button>'
      + '</td></tr>';
  }).join('');
  $('#chronik-tbody').html(rows || '<tr><td colspan="6" class="text-muted text-center py-3">Keine Einträge.</td></tr>');
  $('#chronik-clear-filters').toggle(!!(chronikSearch || chronikFilterOrt || chronikFilterTag));
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
    if (!$('#ef-new-link-form').hasClass('d-none')) {
      $('#ef-nl-title, #ef-nl-url').val('');
      $('#ef-nl-type').val('');
      $('#ef-nl-title').trigger('focus');
    }
  });
  $('#btn-ef-nl-cancel').on('click', function () { $('#ef-new-link-form').addClass('d-none'); });
  $('#btn-ef-nl-save').on('click', function () { saveInlineNewLink(); });
  $('#ef-nl-url').on('input', function () {
    if ($('#ef-nl-type').val() !== '') { return; }
    var t = inferLinkType($(this).val().trim());
    if (t) { $('#ef-nl-type').val(t); }
  });
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
  var url   = normalizeDocsUrl($('#ef-nl-url').val().trim());
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

function addAlbLinkChip(id) {
  if ($('#alb-link-ids .alb-link-chip[data-id="' + id.replace(/"/g, '\\"') + '"]').length) { return; }
  var link = linkById(id);
  var label = link ? (linkLabel(link) || id) : id;
  var $chip = $('<span>')
    .addClass('badge alb-link-chip d-inline-flex align-items-center gap-1 me-1 mb-1')
    .css({ background: 'rgba(var(--color-primary-rgb),.18)', color: 'var(--color-primary)' })
    .attr('data-id', id)
    .text(label);
  var $rm = $('<button type="button" aria-label="Entfernen" style="font-size:.6rem;opacity:.6;background:none;border:none;padding:0;line-height:1;">&times;</button>');
  $rm.on('click', function () { $chip.remove(); });
  $chip.append($rm);
  $('#alb-link-ids').append($chip);
}

function renderAlbLinkSuggestions(query) {
  var $box = $('#alb-link-suggestions');
  if (!query || query.length < 2) { $box.empty(); return; }
  var q = query.toLowerCase();
  var existing = $('#alb-link-ids .alb-link-chip').map(function () { return $(this).attr('data-id'); }).get();
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
    return '<button type="button" class="list-group-item list-group-item-action alb-link-suggestion small" data-id="' + sanitize(it['@id']) + '">'
      + '<span class="fw-semibold">' + sanitize(it.title || '') + '</span>'
      + ' <small class="text-muted">' + sanitize(it.url || '') + '</small>'
      + '</button>';
  }).join(''));
}

function saveAlbInlineNewLink() {
  var title = $('#alb-nl-title').val().trim();
  var url   = normalizeDocsUrl($('#alb-nl-url').val().trim());
  var type  = $('#alb-nl-type').val();
  if (!title || !url) { showToast('Titel und URL sind Pflicht.', false); return; }
  var items = state.links.itemListElement || [];
  var urlLower = url.toLowerCase();
  var existing = null;
  $.each(items, function (_, li) {
    if (li.item && (li.item.url || '').toLowerCase() === urlLower) { existing = li.item; return false; }
  });
  if (existing) {
    showToast('URL bereits vorhanden - Link verknüpft: ' + (existing.title || url), true);
    addAlbLinkChip(existing['@id']);
    $('#alb-new-link-form').addClass('d-none');
    $('#alb-nl-title, #alb-nl-url').val('');
    return;
  }
  var newId = 'urn:uuid:' + crypto.randomUUID();
  items.push({ '@type': 'ListItem', item: { '@id': newId, title: title, url: url, type: type } });
  state.links.itemListElement = items;
  saveLinks(function () {
    addAlbLinkChip(newId);
    refreshLinksFilter();
    renderLinksTab();
    showToast('Link angelegt und verknüpft.', true);
  });
  $('#alb-new-link-form').addClass('d-none');
  $('#alb-nl-title, #alb-nl-url').val('');
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
  $('#lm-url').on('input', function () {
    if ($('#lm-type').val() !== '') { return; }
    var t = inferLinkType($(this).val().trim());
    if (t) { $('#lm-type').val(t); }
  });
}

function openLinkModal(id) {
  currentLinkId = id || null;
  var li = id ? $.grep(state.links.itemListElement || [], function (l) { return l.item && l.item['@id'] === id; })[0] : null;
  var it = li ? (li.item || {}) : {};
  $('#lm-title').val(it.title       || '');
  $('#lm-url').val(it.url           || '');
  $('#lm-desc').val(it.description  || '');
  $('#lm-type').val(it.type         || '');
  $('#lm-method').val(it.httpMethod  || '');
  $('#lm-encoding').val(it.encodingType || '');
  $('#lm-api-fields').toggleClass('d-none', (it.type || '') !== 'api');
  $('#link-modal-label').text(li ? 'Link bearbeiten' : 'Neuer Link');
  $('#link-save-msg').text('');
  new bootstrap.Modal($('#link-modal')[0]).show();
}

function saveLinkFromModal() {
  var title = $('#lm-title').val().trim();
  var url   = normalizeDocsUrl($('#lm-url').val().trim());
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
function initNewAlbumModal() {
  $('#btn-new-album').on('click', function () {
    $('#new-alb-path').html('<option value="">- Laden... -</option>');
    $('#new-alb-title').val('');
    $('#new-alb-msg').text('');
    $.get('/api/album/dirs', function (dirs) {
      if (!dirs.length) {
        $('#new-alb-path').html('<option value="">Keine Ordner verfugbar</option>');
      } else {
        $('#new-alb-path').html('<option value="">- Bitte waehlen -</option>'
          + $.map(dirs, function (d) { return '<option value="' + sanitize(d) + '">' + sanitize(d) + '</option>'; }).join(''));
      }
      lucide.createIcons();
    }).fail(function () {
      $('#new-alb-path').html('<option value="">Fehler beim Laden</option>');
    });
    new bootstrap.Modal($('#new-album-modal')[0]).show();
  });

  $('#btn-new-alb-save').on('click', function () {
    var path  = $('#new-alb-path').val();
    var title = $('#new-alb-title').val().trim();
    if (!path)  { $('#new-alb-msg').text('Bitte einen Ordner wahlen.'); return; }
    if (!title) { $('#new-alb-msg').text('Bitte einen Titel eingeben.'); return; }
    $.ajax({
      url: '/api/album?path=' + encodeURIComponent(path), type: 'POST', contentType: 'application/json',
      data: JSON.stringify({ title: title }),
      success: function () {
        bootstrap.Modal.getInstance($('#new-album-modal')[0]).hide();
        $.get('/api/albums', function (albums) {
          state.albums = albums || [];
          renderAlbenList();
        });
        showToast('Album-Config erstellt.', true);
      },
      error: function (xhr) {
        $('#new-alb-msg').text('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status));
      }
    });
  });
}

function initAlbenTab() {
  initNewAlbumModal();

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

  $('#album-edit-modal').on('hidden.bs.modal', function () { currentAlbumPath = null; });

  $('#btn-alb-new-link').on('click', function () {
    $('#alb-new-link-form').toggleClass('d-none');
    if (!$('#alb-new-link-form').hasClass('d-none')) {
      $('#alb-nl-title, #alb-nl-url').val('');
      $('#alb-nl-type').val('');
      $('#alb-nl-title').trigger('focus');
    }
  });
  $('#btn-alb-nl-cancel').on('click', function () { $('#alb-new-link-form').addClass('d-none'); });
  $('#btn-alb-nl-save').on('click', function () { saveAlbInlineNewLink(); });
  $('#alb-nl-url').on('input', function () {
    if ($('#alb-nl-type').val() !== '') { return; }
    var t = inferLinkType($(this).val().trim());
    if (t) { $('#alb-nl-type').val(t); }
  });
  $('#alb-link-search').on('input', function () { renderAlbLinkSuggestions($(this).val()); });
  $('#alb-link-suggestions').on('click', '.alb-link-suggestion', function () {
    addAlbLinkChip($(this).attr('data-id'));
    $('#alb-link-search').val('');
    $('#alb-link-suggestions').empty();
  });

  $('#btn-alb-save').on('click', function () {
    if (!currentAlbumPath) { return; }
    var title = $('#alb-title').val().trim();
    if (!title) { $('#alb-save-msg').text('Titel ist Pflicht.'); return; }
    var cfg = { title: title, consent_collected: $('#alb-consent').prop('checked') };
    var desc = $('#alb-desc').val().trim();
    if (desc) { cfg.description = desc; }
    var preview = $('#alb-preview').val().trim();
    if (preview) { cfg.preview = preview; }
    var cid = $('#alb-chronicle').val();
    if (cid) { cfg.chronicle_id = cid; }
    var blur   = chipContainerValues($('#alb-blur-chips'));
    var noblur = chipContainerValues($('#alb-noblur-chips'));
    if (blur.length)   { cfg.blur    = blur; }
    if (noblur.length) { cfg.no_blur = noblur; }
    var linkIds = $('#alb-link-ids .alb-link-chip').map(function () { return $(this).attr('data-id'); }).get();
    if (linkIds.length) { cfg.link_ids = linkIds; }
    $.ajax({
      url: '/api/album?path=' + encodeURIComponent(currentAlbumPath), type: 'POST', contentType: 'application/json',
      data: JSON.stringify(cfg),
      success: function () {
        bootstrap.Modal.getInstance($('#album-edit-modal')[0]).hide();
        $.get('/api/albums', function (albums) {
          state.albums = albums || [];
          renderAlbenList();
        });
        showToast('Album gespeichert. Bitte process.py ausfuehren.', true);
      },
      error: function (xhr) { $('#alb-save-msg').text('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status)); }
    });
  });
}

function renderAlbenList() {
  var $tbody  = $('#alben-tbody');
  var $empty  = $('#alben-empty');
  var $filter = $('#alben-filter-top');
  var selected = $filter.val() || '';

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
    $tbody.empty();
    $empty.removeClass('d-none');
    return;
  }
  $empty.addClass('d-none');
  var rows = $.map(filtered, function (a) {
    var rawDesc = a.description || '';
    var descShort = rawDesc.length > 60 ? rawDesc.slice(0, 60) + '...' : rawDesc;
    var entry = null;
    if (a.chronicle_id) {
      $.each(state.chronicle.itemListElement || [], function (_, e) {
        if (e['@id'] === a.chronicle_id) { entry = e; return false; }
      });
    }
    var chronicleText = entry ? sanitize(egFormatDate(entry.date) + ' - ' + (entry.title || '')) : '';
    var consentIcon = a.consent_collected
      ? '<i data-lucide="check-square" aria-hidden="true" style="color:var(--color-primary);"></i>'
      : '<i data-lucide="square" aria-hidden="true" class="text-muted"></i>';
    var path = sanitize(a.path);
    return '<tr>'
      + '<td><a href="#" class="album-title-link text-decoration-none" data-path="' + path + '">' + sanitize(a.title) + '</a></td>'
      + '<td class="hide-sm text-muted small" title="' + sanitize(rawDesc) + '">' + sanitize(descShort) + '</td>'
      + '<td class="hide-sm small">' + chronicleText + '</td>'
      + '<td class="text-center">' + consentIcon + '</td>'
      + '<td class="hide-sm text-muted small">' + path + '</td>'
      + '<td class="text-end text-nowrap">'
      + '<button class="btn btn-sm btn-outline-secondary me-1 btn-edit-album" data-path="' + path + '" aria-label="Bearbeiten"><i data-lucide="pencil" aria-hidden="true"></i></button>'
      + '<button class="btn btn-sm btn-outline-danger btn-delete-album" data-path="' + path + '" aria-label="Loeschen"><i data-lucide="trash-2" aria-hidden="true"></i></button>'
      + '</td></tr>';
  }).join('');
  $tbody.html(rows);
  lucide.createIcons();
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

function openAlbumModal(path) {
  currentAlbumPath = path;
  $('#album-edit-modal-label').text('Album: ' + path);
  $('#alb-save-msg').text('');
  $.get('/api/album?path=' + encodeURIComponent(path), function (cfg) {
    $('#alb-title').val(cfg.title || '');
    $('#alb-desc').val(cfg.description || '');
    $('#alb-consent').prop('checked', !!cfg.consent_collected);
    $('#alb-preview').val(cfg.preview || '');
    buildChronicleDropdown($('#alb-chronicle'), cfg.chronicle_id || '');
    renderChronicleInfo(cfg.chronicle_id || '');
    clearChips($('#alb-blur-chips'));
    $.each(cfg.blur || [], function (_, f) { addChip($('#alb-blur-chips'), f); });
    clearChips($('#alb-noblur-chips'));
    $.each(cfg.no_blur || [], function (_, f) { addChip($('#alb-noblur-chips'), f); });
    $('#alb-link-ids').empty();
    $.each(cfg.link_ids || [], function (_, id) { addAlbLinkChip(id); });
    $('#alb-link-search').val('');
    $('#alb-link-suggestions').empty();
    $('#alb-new-link-form').addClass('d-none');
    new bootstrap.Modal($('#album-edit-modal')[0]).show();
    lucide.createIcons();
  }).fail(function (xhr) {
    var err = (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : ('HTTP ' + xhr.status);
    showToast('Album laden fehlgeschlagen: ' + err, false);
  });
}

function deleteAlbum(path) {
  if (!confirm('Album-Config wirklich loschen?\n' + path)) { return; }
  $.ajax({
    url: '/api/album/delete?path=' + encodeURIComponent(path), type: 'POST',
    success: function () {
      state.albums = $.grep(state.albums, function (a) { return a.path !== path; });
      renderAlbenList();
      showToast('Album-Config geloscht.', true);
    },
    error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); }
  });
}

/* ═══════════════════════════════════════════════
   Downloads tab
═══════════════════════════════════════════════ */
function renderDownloadsList() {
  var $list  = $('#dl-list');
  var $empty = $('#dl-empty');
  if (!state.downloads || state.downloads.length === 0) {
    $list.html('');
    $empty.removeClass('d-none');
    return;
  }
  $empty.addClass('d-none');

  var bereiche = {}, themen = {}, gruppen = {};
  $.each(state.downloads, function (_, d) {
    var p = d.folder ? d.folder.split('/') : [];
    if (p[0]) { bereiche[p[0]] = true; }
    if (p[1]) { themen[p[1]] = true; }
    if (p[2]) { gruppen[p[2]] = true; }
  });
  var hasBer  = Object.keys(bereiche).length > 0;
  var hasThem = Object.keys(themen).length > 0;
  var hasGrp  = Object.keys(gruppen).length > 0;

  var filterHtml = '<div class="d-flex gap-2 mb-3 flex-wrap align-items-center" id="dl-filter-bar">'
    + '<label for="dl-search" class="visually-hidden">Dateien suchen</label>'
    + '<input type="search" id="dl-search" class="form-control" style="max-width:280px" placeholder="Dateien suchen..." value="' + sanitize(dlSearch) + '">'
    + (hasBer ? ('<label for="dl-filter-bereich" class="visually-hidden">Bereich</label>'
        + '<select id="dl-filter-bereich" class="form-select" style="max-width:180px"><option value="">Alle Bereiche</option>'
        + $.map(Object.keys(bereiche).sort(), function (b) { return '<option value="' + sanitize(b) + '"' + (dlFilterBereich === b ? ' selected' : '') + '>' + sanitize(b) + '</option>'; }).join('') + '</select>') : '')
    + (hasThem ? ('<label for="dl-filter-thema" class="visually-hidden">Thema</label>'
        + '<select id="dl-filter-thema" class="form-select" style="max-width:180px"><option value="">Alle Themen</option>'
        + $.map(Object.keys(themen).sort(), function (t) { return '<option value="' + sanitize(t) + '"' + (dlFilterThema === t ? ' selected' : '') + '>' + sanitize(t) + '</option>'; }).join('') + '</select>') : '')
    + (hasGrp ? ('<label for="dl-filter-gruppe" class="visually-hidden">Gruppe</label>'
        + '<select id="dl-filter-gruppe" class="form-select" style="max-width:180px"><option value="">Alle Gruppen</option>'
        + $.map(Object.keys(gruppen).sort(), function (g) { return '<option value="' + sanitize(g) + '"' + (dlFilterGruppe === g ? ' selected' : '') + '>' + sanitize(g) + '</option>'; }).join('') + '</select>') : '')
    + '<button type="button" id="dl-clear-filters" class="btn btn-sm btn-outline-danger dl-clear-btn" aria-label="Filter loeschen">'
    + '<i data-lucide="x" aria-hidden="true"></i> Filter loeschen</button>'
    + '<button type="button" id="btn-dl-new" class="btn btn-sm btn-eg ms-auto"><i data-lucide="plus" aria-hidden="true"></i> Neu</button>'
    + '</div>';

  var thead = '<thead><tr>'
    + '<th class="dl-fmt-col">Format</th>'
    + '<th>Name</th>'
    + (hasBer  ? '<th>Bereich</th>' : '')
    + (hasThem ? '<th>Thema</th>'   : '')
    + (hasGrp  ? '<th>Gruppe</th>'  : '')
    + '<th><span class="visually-hidden">Links</span></th>'
    + '<th><span class="visually-hidden">Bearbeiten</span></th>'
    + '</tr></thead>';

  $list.html(filterHtml
    + '<div class="table-responsive">'
    + '<table class="table table-hover align-middle mb-0" id="downloads-table">'
    + thead + '<tbody id="dl-tbody"></tbody>'
    + '</table></div>');

  $list.data({ hasBer: hasBer, hasThem: hasThem, hasGrp: hasGrp });
  renderDownloadsRows();
  lucide.createIcons();
}

function renderDownloadsRows() {
  var $list  = $('#dl-list');
  var hasBer  = $list.data('hasBer');
  var hasThem = $list.data('hasThem');
  var hasGrp  = $list.data('hasGrp');
  var search  = dlSearch.toLowerCase();

  var rows = $.map(state.downloads, function (d) {
    var fp = d.folder ? d.folder.split('/') : [];
    if (search && (d.name + ' ' + d.description).toLowerCase().indexOf(search) === -1) { return ''; }
    if (dlFilterBereich && fp[0] !== dlFilterBereich) { return ''; }
    if (dlFilterThema   && fp[1] !== dlFilterThema)   { return ''; }
    if (dlFilterGruppe  && fp[2] !== dlFilterGruppe)  { return ''; }

    var ext      = d.name.lastIndexOf('.') > 0 ? d.name.split('.').pop().toLowerCase() : '';
    var extClass = KNOWN_BADGE_EXTS[ext] ? ext : 'default';
    var extLabel = ext ? ext.toUpperCase() : 'FILE';

    var linkBtns = $.map(d.link_ids || [], function (lid) {
      var lnk = linkById(lid);
      if (!lnk || !lnk.url) { return ''; }
      var cls   = LINK_BUTTON_CLASS[lnk.type || ''] || 'btn-outline-secondary';
      var label = sanitize(linkLabel(lnk));
      return '<a href="' + sanitize(lnk.url) + '" class="btn btn-sm ' + cls + ' me-1" target="_blank" rel="noopener noreferrer" aria-label="' + label + '">' + label + '</a>';
    }).join('');

    var folderAttr = ' data-folder="' + sanitize(d.folder) + '" data-name="' + sanitize(d.name) + '"';
    return '<tr>'
      + '<td class="dl-fmt-col"><span class="file-badge ' + extClass + '">' + extLabel + '</span></td>'
      + '<td class="dl-name-cell"><a href="#" class="dl-name-link dl-edit-file"' + folderAttr + '>'
      +   '<span class="fw-semibold">' + sanitize(d.name) + '</span>'
      +   (d.description ? '<small class="text-muted d-block">' + sanitize(d.description) + '</small>' : '')
      + '</a></td>'
      + (hasBer  ? '<td class="text-muted small">' + sanitize(fp[0] || '') + '</td>' : '')
      + (hasThem ? '<td class="text-muted small">' + sanitize(fp[1] || '') + '</td>' : '')
      + (hasGrp  ? '<td class="text-muted small">' + sanitize(fp[2] || '') + '</td>' : '')
      + '<td class="dl-action-col">' + linkBtns + '</td>'
      + '<td class="dl-action-col"><button type="button" class="btn btn-sm btn-outline-secondary dl-edit-file"' + folderAttr + ' aria-label="Bearbeiten"><i data-lucide="pencil" aria-hidden="true"></i></button></td>'
      + '</tr>';
  });

  $('#dl-tbody').html(rows.join(''));
  lucide.createIcons();
  $('#dl-clear-filters').toggle(!!(dlSearch || dlFilterBereich || dlFilterThema || dlFilterGruppe));
}

function openDownloadForm(folder, filename) {
  currentDownloadPath = folder;
  currentDownloadFile = filename;
  $('#dl-edit-modal-label').text(filename);
  $('#dl-edit-modal-folder').text(folder);
  $('#dl-save-msg').text('');
  $.get('/api/download-meta?path=' + encodeURIComponent(folder), function (meta) {
    var part = null;
    $.each(meta.hasPart || [], function (_, p) { if (p.title === filename) { part = p; return false; } });
    if (!part) { part = { title: filename, description: '', link_ids: [], tags: [] }; }

    $('#dl-file-desc').val(part.description || '');

    var $links = $('#dl-file-links').empty();
    $.each(part.link_ids || [], function (_, lid) {
      var lnk = linkById(lid);
      $links.append(buildDlFileChip(lid, lnk ? linkLabel(lnk) : lid));
    });

    var $tagChips = $('#dl-file-tag-chips').empty();
    $.each(part.tags || [], function (_, t) { $tagChips.append(buildDlTagChip(t)); });

    $('#dl-file-link-search').val('');
    $('#dl-file-link-suggestions').empty().hide();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('dl-edit-modal')).show();
  }).fail(function (xhr) {
    showToast('Laden fehlgeschlagen: ' + ((xhr.responseJSON && xhr.responseJSON.error) || xhr.status), false);
  });
}

function buildDlFileChip(id, label) {
  return $('<span class="badge bg-primary me-1 dl-file-link-chip" data-id="' + sanitize(id) + '">'
    + sanitize(label) + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1" aria-label="Link entfernen"></button></span>');
}

function buildDlTagChip(key) {
  return $('<span class="badge bg-secondary me-1 dl-file-tag-chip" data-key="' + sanitize(key) + '">'
    + sanitize(key) + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1" aria-label="Tag entfernen"></button></span>');
}

function buildDlNewLinkChip(id, label) {
  return $('<span class="badge bg-primary me-1 dl-new-link-chip" data-id="' + sanitize(id) + '">'
    + sanitize(label) + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1" aria-label="Link entfernen"></button></span>');
}

function buildDlNewTagChip(key) {
  return $('<span class="badge bg-secondary me-1 dl-new-tag-chip" data-key="' + sanitize(key) + '">'
    + sanitize(key) + ' <button type="button" class="btn-close btn-close-white btn-close-sm ms-1" aria-label="Tag entfernen"></button></span>');
}

function saveDlFile() {
  var folder   = currentDownloadPath;
  var filename = currentDownloadFile;
  if (!folder || !filename) { return; }
  var linkIds = [];
  $('#dl-file-links .dl-file-link-chip').each(function () { linkIds.push($(this).attr('data-id')); });
  var tags = [];
  $('#dl-file-tag-chips .dl-file-tag-chip').each(function () { tags.push($(this).attr('data-key')); });
  var updatedPart = { '@type': 'MediaObject', title: filename, link_ids: linkIds, tags: tags };
  var desc = $('#dl-file-desc').val().trim();
  if (desc) { updatedPart.description = desc; }

  $.get('/api/download-meta?path=' + encodeURIComponent(folder), function (meta) {
    var hasPart = meta.hasPart || [];
    var found = false;
    $.each(hasPart, function (i, p) { if (p.title === filename) { hasPart[i] = updatedPart; found = true; return false; } });
    if (!found) { hasPart.push(updatedPart); }
    meta.hasPart = hasPart;
    $.ajax({
      url: '/api/download-meta?path=' + encodeURIComponent(folder),
      type: 'POST', contentType: 'application/json',
      data: JSON.stringify(meta),
      success: function () {
        showToast('Gespeichert.', true);
        bootstrap.Modal.getInstance(document.getElementById('dl-edit-modal')).hide();
        $.get('/api/download-entries', function (list) { state.downloads = list || []; renderDownloadsList(); });
      },
      error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); },
    });
  });
}

function openDlNewModal() {
  $.get('/api/downloads', function (folders) {
    var withMeta = $.grep(folders || [], function (f) { return f.hasMeta; });
    var $sel = $('#dl-new-folder').empty();
    if (!withMeta.length) {
      $sel.append('<option value="">Keine Ordner mit _meta.json</option>');
    } else {
      $sel.append('<option value="">-- Ordner wahlen --</option>');
      $.each(withMeta, function (_, f) {
        $sel.append('<option value="' + sanitize(f.path) + '">' + sanitize(f.path) + '</option>');
      });
    }
    $('#dl-new-name').val('');
    $('#dl-new-desc').val('');
    $('#dl-new-links').empty();
    $('#dl-new-tag-chips').empty();
    $('#dl-new-link-search').val('');
    $('#dl-new-link-suggestions').empty().hide();
    $('#dl-new-msg').text('');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('dl-new-modal')).show();
  }).fail(function () { showToast('Fehler beim Laden der Ordner.', false); });
}

function saveDlNew() {
  var folder   = $('#dl-new-folder').val();
  var filename = $('#dl-new-name').val().trim();
  var desc     = $('#dl-new-desc').val().trim();
  if (!folder)   { $('#dl-new-msg').text('Bitte einen Ordner wahlen.'); return; }
  if (!filename) { $('#dl-new-msg').text('Dateiname ist Pflicht.'); return; }

  var linkIds = [];
  $('#dl-new-links .dl-new-link-chip').each(function () { linkIds.push($(this).attr('data-id')); });
  var tags = [];
  $('#dl-new-tag-chips .dl-new-tag-chip').each(function () { tags.push($(this).attr('data-key')); });
  var newPart = { '@type': 'MediaObject', title: filename, link_ids: linkIds, tags: tags };
  if (desc) { newPart.description = desc; }

  $.get('/api/download-meta?path=' + encodeURIComponent(folder), function (meta) {
    var hasPart = meta.hasPart || [];
    var dup = false;
    $.each(hasPart, function (_, p) { if (p.title === filename) { dup = true; return false; } });
    if (dup) { $('#dl-new-msg').text('Dateiname existiert bereits in diesem Ordner.'); return; }
    hasPart.push(newPart);
    meta.hasPart = hasPart;
    $.ajax({
      url: '/api/download-meta?path=' + encodeURIComponent(folder),
      type: 'POST', contentType: 'application/json',
      data: JSON.stringify(meta),
      success: function () {
        showToast('Eintrag angelegt.', true);
        bootstrap.Modal.getInstance(document.getElementById('dl-new-modal')).hide();
        $.get('/api/download-entries', function (list) { state.downloads = list || []; renderDownloadsList(); });
      },
      error: function (xhr) { showToast('Fehler: ' + (xhr.responseJSON && xhr.responseJSON.error || xhr.status), false); },
    });
  }).fail(function (xhr) {
    showToast('Laden fehlgeschlagen: ' + ((xhr.responseJSON && xhr.responseJSON.error) || xhr.status), false);
  });
}

function initDownloadsTab() {
  $('#dl-list').on('click', '.dl-edit-file', function (e) {
    e.preventDefault();
    openDownloadForm($(this).attr('data-folder'), $(this).attr('data-name'));
  });

  $('#dl-list').on('input', '#dl-search', function () {
    dlSearch = $(this).val();
    renderDownloadsRows();
  });
  $('#dl-list').on('change', '#dl-filter-bereich', function () { dlFilterBereich = $(this).val(); renderDownloadsRows(); });
  $('#dl-list').on('change', '#dl-filter-thema',   function () { dlFilterThema   = $(this).val(); renderDownloadsRows(); });
  $('#dl-list').on('change', '#dl-filter-gruppe',  function () { dlFilterGruppe  = $(this).val(); renderDownloadsRows(); });
  $('#dl-list').on('click', '#dl-clear-filters', function () {
    dlSearch = ''; dlFilterBereich = ''; dlFilterThema = ''; dlFilterGruppe = '';
    renderDownloadsList();
  });

  $('#dl-edit-modal').on('hidden.bs.modal', function () {
    currentDownloadPath = null;
    currentDownloadFile = null;
  });

  $('#dl-file-link-search').on('input', function () {
    var query = $(this).val().trim().toLowerCase();
    var $sug  = $('#dl-file-link-suggestions');
    if (!query) { $sug.empty().hide(); return; }
    var existing = [];
    $('#dl-file-links .dl-file-link-chip').each(function () { existing.push($(this).attr('data-id')); });
    var matches = [];
    $.each(state.links.itemListElement || [], function (_, li) {
      if (!li.item || !li.item['@id']) { return; }
      if (existing.indexOf(li.item['@id']) !== -1) { return; }
      if ((li.item.title || '').toLowerCase().indexOf(query) !== -1 || (li.item.url || '').toLowerCase().indexOf(query) !== -1) {
        matches.push(li.item);
      }
    });
    if (!matches.length) { $sug.empty().hide(); return; }
    $sug.html($.map(matches.slice(0, 8), function (lnk) {
      return '<a href="#" class="list-group-item list-group-item-action py-1 dl-file-link-pick" data-id="' + sanitize(lnk['@id']) + '">'
        + sanitize(linkLabel(lnk) || lnk.url) + '</a>';
    }).join('')).show();
  });

  $('#dl-file-link-suggestions').on('click', '.dl-file-link-pick', function (e) {
    e.preventDefault();
    var id  = $(this).attr('data-id');
    var lnk = linkById(id);
    $('#dl-file-links').append(buildDlFileChip(id, lnk ? linkLabel(lnk) : id));
    $('#dl-file-link-search').val('');
    $('#dl-file-link-suggestions').empty().hide();
  });

  $('#dl-file-links').on('click', '.btn-close', function () { $(this).closest('.dl-file-link-chip').remove(); });
  $('#dl-file-tag-chips').on('click', '.btn-close', function () { $(this).closest('.dl-file-tag-chip').remove(); });

  $('#dl-file-tags-btn').on('show.bs.dropdown', function () {
    var $menu    = $('#dl-file-tags-menu');
    var existing = [];
    $('#dl-file-tag-chips .dl-file-tag-chip').each(function () { existing.push($(this).attr('data-key')); });
    var allTags  = {};
    $.each(state.tags.location_tags    || {}, function (k, v) { allTags[k] = v.label || k; });
    $.each(state.tags.description_tags || {}, function (k, v) { allTags[k] = v.label || k; });
    $menu.empty();
    $.each(allTags, function (key, label) {
      if (existing.indexOf(key) !== -1) { return; }
      $menu.append('<li><a href="#" class="dropdown-item py-1 dl-file-tag-pick" data-key="' + sanitize(key) + '">' + sanitize(label) + '</a></li>');
    });
    if (!$menu.children().length) { $menu.append('<li><span class="dropdown-item text-muted">Keine weiteren Tags</span></li>'); }
  });

  $('#dl-file-tags-menu').on('click', '.dl-file-tag-pick', function (e) {
    e.preventDefault();
    $('#dl-file-tag-chips').append(buildDlTagChip($(this).attr('data-key')));
  });

  $('#btn-save-dl-file').on('click', saveDlFile);

  $('#dl-list').on('click', '#btn-dl-new', openDlNewModal);

  $('#dl-new-link-search').on('input', function () {
    var query = $(this).val().trim().toLowerCase();
    var $sug  = $('#dl-new-link-suggestions');
    if (!query) { $sug.empty().hide(); return; }
    var existing = [];
    $('#dl-new-links .dl-new-link-chip').each(function () { existing.push($(this).attr('data-id')); });
    var matches = [];
    $.each(state.links.itemListElement || [], function (_, li) {
      if (!li.item || !li.item['@id']) { return; }
      if (existing.indexOf(li.item['@id']) !== -1) { return; }
      if ((li.item.title || '').toLowerCase().indexOf(query) !== -1 || (li.item.url || '').toLowerCase().indexOf(query) !== -1) {
        matches.push(li.item);
      }
    });
    if (!matches.length) { $sug.empty().hide(); return; }
    $sug.html($.map(matches.slice(0, 8), function (lnk) {
      return '<a href="#" class="list-group-item list-group-item-action py-1 dl-new-link-pick" data-id="' + sanitize(lnk['@id']) + '">'
        + sanitize(linkLabel(lnk) || lnk.url) + '</a>';
    }).join('')).show();
  });

  $('#dl-new-link-suggestions').on('click', '.dl-new-link-pick', function (e) {
    e.preventDefault();
    var id  = $(this).attr('data-id');
    var lnk = linkById(id);
    $('#dl-new-links').append(buildDlNewLinkChip(id, lnk ? linkLabel(lnk) : id));
    $('#dl-new-link-search').val('');
    $('#dl-new-link-suggestions').empty().hide();
  });

  $('#dl-new-links').on('click', '.btn-close', function () { $(this).closest('.dl-new-link-chip').remove(); });
  $('#dl-new-tag-chips').on('click', '.btn-close', function () { $(this).closest('.dl-new-tag-chip').remove(); });

  $('#dl-new-tags-btn').on('show.bs.dropdown', function () {
    var $menu    = $('#dl-new-tags-menu');
    var existing = [];
    $('#dl-new-tag-chips .dl-new-tag-chip').each(function () { existing.push($(this).attr('data-key')); });
    var allTags  = {};
    $.each(state.tags.location_tags    || {}, function (k, v) { allTags[k] = v.label || k; });
    $.each(state.tags.description_tags || {}, function (k, v) { allTags[k] = v.label || k; });
    $menu.empty();
    $.each(allTags, function (key, label) {
      if (existing.indexOf(key) !== -1) { return; }
      $menu.append('<li><a href="#" class="dropdown-item py-1 dl-new-tag-pick" data-key="' + sanitize(key) + '">' + sanitize(label) + '</a></li>');
    });
    if (!$menu.children().length) { $menu.append('<li><span class="dropdown-item text-muted">Keine weiteren Tags</span></li>'); }
  });

  $('#dl-new-tags-menu').on('click', '.dl-new-tag-pick', function (e) {
    e.preventDefault();
    $('#dl-new-tag-chips').append(buildDlNewTagChip($(this).attr('data-key')));
  });

  $('#dl-new-modal').on('hidden.bs.modal', function () { $('#dl-new-msg').text(''); });

  $('#btn-save-dl-new').on('click', saveDlNew);
}


