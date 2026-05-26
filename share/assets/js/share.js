if (window.lucide) { lucide.createIcons(); }

// ── Theme toggle ──────────────────────────────────────────────────────────────
$('#theme-toggle').on('click', function () {
  var next = $('html').attr('data-theme') === 'dark' ? 'light' : 'dark';
  $('html').attr('data-theme', next);
  localStorage.setItem('eg-theme', next);
});

// ── Router ────────────────────────────────────────────────────────────────────
var TAB_DEFAULT = 'downloads';
var TAB_HASHES = {
  'downloads':     'tab-downloads-trigger',
  'gallery':       'tab-galerie-trigger',
  'presentations': 'tab-presentations-trigger',
  'logos':         'tab-logos-trigger',
  'qr':            'tab-qr-trigger',
  'configs':       'tab-configs-trigger',
  'apis':          'tab-apis-trigger',
};
var TRIGGER_TO_HASH = {};
$.each(TAB_HASHES, function (h, id) { TRIGGER_TO_HASH[id] = h; });

function routeRead() {
  var params      = new URLSearchParams(window.location.search);
  var hash        = window.location.hash.slice(1);
  var tab         = TAB_DEFAULT;
  var galleryPath = '';
  if (hash === 'gallery' || hash.startsWith('gallery/')) {
    tab = 'gallery';
    galleryPath = hash.startsWith('gallery/') ? hash.slice(8) : '';
  } else if (TAB_HASHES[hash]) {
    tab = hash;
  }
  return {
    tab:         tab,
    galleryPath: galleryPath,
    q:           params.get('q')       || '',
    bereich:     params.get('bereich') || '',
    thema:       params.get('thema')   || '',
    gruppe:      params.get('gruppe')  || '',
  };
}

function routeWrite(tab, q, bereich, thema, gruppe) {
  var params = new URLSearchParams();
  if (q)       { params.set('q',       q); }
  if (bereich) { params.set('bereich', bereich); }
  if (thema)   { params.set('thema',   thema); }
  if (gruppe)  { params.set('gruppe',  gruppe); }
  var search = params.toString() ? '?' + params.toString() : '';
  var hash   = tab !== TAB_DEFAULT ? '#' + tab : '';
  history.replaceState(null, '', (search + hash) || window.location.pathname);
}

// ── Apply initial tab from route ──────────────────────────────────────────────
var route     = routeRead();
var activeTab = route.tab;
var tabEl     = document.getElementById(TAB_HASHES[route.tab]);
if (tabEl) { bootstrap.Tab.getOrCreateInstance(tabEl).show(); }

$('[data-bs-toggle="tab"]').on('shown.bs.tab', function () {
  activeTab = TRIGGER_TO_HASH[this.id] || TAB_DEFAULT;
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
});

// ── Downloads filters ─────────────────────────────────────────────────────────
var activeQ       = route.q;
var activeBereich = route.bereich;
var activeThema   = route.thema;
var activeGruppe  = route.gruppe;

if (route.q)       { $('#file-search').val(route.q); }
if (route.bereich) { $('#bereich-filter').val(route.bereich); }
if (route.thema)   { $('#thema-filter').val(route.thema); }
if (route.gruppe)  { $('#gruppe-filter').val(route.gruppe); }

function updateClearButton() {
  $('#clear-filters').toggle(!!(activeQ || activeBereich || activeThema || activeGruppe));
}

$('#file-search').on('input', function () {
  activeQ = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#bereich-filter').on('change', function () {
  activeBereich = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#thema-filter').on('change', function () {
  activeThema = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#gruppe-filter').on('change', function () {
  activeGruppe = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#clear-filters').on('click', function () {
  activeQ = ''; activeBereich = ''; activeThema = ''; activeGruppe = '';
  $('#file-search').val('');
  $('#bereich-filter, #thema-filter, #gruppe-filter').val('');
  routeWrite(activeTab, '', '', '', '');
  applyDownloadFilters();
  updateClearButton();
});

function applyDownloadFilters() {
  var q = activeQ.toLowerCase();
  $('#downloads-table tbody tr').each(function () {
    var folder       = $(this).data('folder') || '';
    var name         = $(this).data('name')   || '';
    var parts        = folder ? folder.split('/') : [];
    var nameMatch    = !q || name.toLowerCase().includes(q) || folder.toLowerCase().includes(q);
    var bereichMatch = !activeBereich || (parts[0] || '') === activeBereich;
    var themaMatch   = !activeThema   || (parts[1] || '') === activeThema;
    var gruppeMatch  = !activeGruppe  || (parts[2] || '') === activeGruppe;
    $(this).toggle(nameMatch && bereichMatch && themaMatch && gruppeMatch);
  });
}

if (route.q || route.bereich || route.thema || route.gruppe) {
  applyDownloadFilters();
}
updateClearButton();

// ── Copy-to-clipboard ─────────────────────────────────────────────────────────
$('.btn-copy').on('click', function () {
  var $btn = $(this);
  navigator.clipboard.writeText($btn.data('url')).then(function () {
    var icon = $btn.find('[data-lucide]').get(0);
    if (!icon) { return; }
    icon.setAttribute('data-lucide', 'clipboard-check');
    lucide.createIcons({ nodes: [icon] });
    setTimeout(function () {
      icon.setAttribute('data-lucide', 'clipboard');
      lucide.createIcons({ nodes: [icon] });
    }, 2000);
  });
});

// ── Scroll-to-top ─────────────────────────────────────────────────────────────
$(window).on('scroll', function () {
  $('#scroll-top').toggleClass('visible', $(window).scrollTop() > 300);
});
$('#scroll-top').on('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function egFormatDate(iso) {
  if (!iso) { return ''; }
  var parts = iso.split('-');
  if (parts.length !== 3) { return iso; }
  return parts[2] + '.' + parts[1] + '.' + parts[0];
}

// ── Gallery ───────────────────────────────────────────────────────────────────
(function () {
  if (typeof GALLERY_DATA === 'undefined') { return; }

  var albums    = GALLERY_DATA.hasPart || [];

  var chronicleMap = {};
  if (typeof CHRONICLE_DATA !== 'undefined' && Array.isArray(CHRONICLE_DATA.itemListElement)) {
    CHRONICLE_DATA.itemListElement.forEach(function (e) {
      if (e['@id']) { chronicleMap[e['@id']] = e; }
    });
  }
  var curFolder = '';
  var curAlbum  = null;
  var lbImages  = [];
  var lbIdx     = 0;

  // Returns direct sub-folders and direct albums at the given folder path.
  // Intermediate paths that are also albums are placed in result.albums (not result.folders).
  function childrenOf(path) {
    var seen        = {};
    var albumByPath = {};
    albums.forEach(function (a) { albumByPath[a.path] = a; });
    var result = { folders: [], albums: [] };
    var albumsAdded = {};
    albums.forEach(function (a) {
      var rel;
      if (path === '') {
        rel = a.path;
      } else if (a.path.startsWith(path + '/')) {
        rel = a.path.slice(path.length + 1);
      } else {
        return;
      }
      if (rel.indexOf('/') === -1) {
        if (!albumsAdded[a.path]) {
          albumsAdded[a.path] = true;
          result.albums.push(a);
        }
      } else {
        var seg = rel.split('/')[0];
        var fp  = path === '' ? seg : path + '/' + seg;
        if (!seen[fp]) {
          seen[fp] = true;
          var intermediate = albumByPath[fp];
          if (intermediate) {
            if (!albumsAdded[fp]) {
              albumsAdded[fp] = true;
              result.albums.push(intermediate);
            }
          } else {
            result.folders.push({ name: seg, path: fp });
          }
        }
      }
    });
    result.albums.sort(function (a, b) {
      var aDate = a.dateCreated || '';
      var bDate = b.dateCreated || '';
      if (aDate && bDate) { return bDate.localeCompare(aDate); }
      if (aDate) { return -1; }
      if (bDate) { return 1; }
      return (a.name || '').localeCompare(b.name || '', 'de');
    });
    result.folders.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return result;
  }

  function albumCountIn(path) {
    return albums.filter(function (a) {
      return a.path === path || a.path.startsWith(path + '/');
    }).length;
  }

  function hasChildren(albumPath) {
    return albums.some(function (a) { return a.path.startsWith(albumPath + '/'); });
  }

  function esc(str) {
    return $('<span>').text(String(str || '')).html();
  }

  // ── Breadcrumb ──────────────────────────────────────────────────────────────
  function renderBreadcrumb() {
    var $bc = $('#gallery-breadcrumb').empty();

    function makeCrumb(label, onClick, isActive) {
      var $li = $('<li class="breadcrumb-item">');
      if (isActive) {
        $li.addClass('active').attr('aria-current', 'page').text(label);
      } else {
        $li.append($('<a href="#">').text(label).on('click', function (e) {
          e.preventDefault(); onClick();
        }));
      }
      return $li;
    }

    var pathParts = curFolder ? curFolder.split('/') : [];
    var isRoot = curFolder === '' && !curAlbum;

    $bc.append(makeCrumb('Galerie', function () { showFolder(''); }, isRoot));

    pathParts.forEach(function (seg, i) {
      var fp     = pathParts.slice(0, i + 1).join('/');
      var isLast = i === pathParts.length - 1 && !curAlbum;
      $bc.append(makeCrumb(seg, function () { showFolder(fp); }, isLast));
    });

    if (curAlbum) {
      $bc.append(makeCrumb(curAlbum.name, null, true));
    }
  }

  // ── Routing ─────────────────────────────────────────────────────────────────
  function galleryRouteUpdate(path) {
    if (activeTab !== 'gallery') { return; }
    var h = 'gallery' + (path ? '/' + path : '');
    history.replaceState(null, '', (window.location.search || '') + '#' + h);
  }

  function galleryRouteSync() {
    var path;
    if ($('#gallery-lightbox').hasClass('show') && curAlbum && lbImages[lbIdx]) {
      path = curAlbum.path + '/' + lbImages[lbIdx].sourceHash;
    } else if (curAlbum) {
      path = curAlbum.path;
    } else {
      path = curFolder;
    }
    galleryRouteUpdate(path);
  }

  function appendAlbumLinks($card, album) {
    var wikiUrl  = album['wiki-url']  || '';
    var rawUrl   = album['raw-url']   || '';
    var cloudUrl = album['cloud-url'] || '';
    var blogUrl  = album['blog-url']  || '';
    if (!wikiUrl && !rawUrl && !cloudUrl && !blogUrl) { return; }
    var $links = $('<div class="gallery-card-links d-flex gap-1 justify-content-end mt-2">');
    if (wikiUrl) {
      $links.append(
        $('<a>').attr({ href: wikiUrl, target: '_blank', rel: 'noopener noreferrer' })
          .addClass('btn btn-sm btn-outline-primary').text('Wiki')
          .on('click', function (e) { e.stopPropagation(); })
      );
    }
    if (rawUrl) {
      $links.append(
        $('<a>').attr({ href: rawUrl, target: '_blank', rel: 'noopener noreferrer' })
          .addClass('btn btn-sm btn-outline-secondary').text('Raw')
          .on('click', function (e) { e.stopPropagation(); })
      );
    }
    if (cloudUrl) {
      $links.append(
        $('<a>').attr({ href: cloudUrl, target: '_blank', rel: 'noopener noreferrer' })
          .addClass('btn btn-sm btn-outline-success').text('Cloud')
          .on('click', function (e) { e.stopPropagation(); })
      );
    }
    if (blogUrl) {
      $links.append(
        $('<a>').attr({ href: blogUrl, target: '_blank', rel: 'noopener noreferrer' })
          .addClass('btn btn-sm btn-outline-beitrag').text('Beitrag')
          .on('click', function (e) { e.stopPropagation(); })
      );
    }
    $card.find('.gallery-card-body').append($links);
  }

  // ── Folder / album overview ─────────────────────────────────────────────────
  function showFolder(path) {
    curFolder = path;
    curAlbum  = null;
    galleryRouteUpdate(path);
    var children    = childrenOf(path);
    var selfMatches = path !== '' ? albums.filter(function (a) { return a.path === path; }) : [];
    var selfAlbum   = selfMatches.length > 0 ? selfMatches[0] : null;
    var mixed       = !!selfAlbum;

    var $grid = $('#gallery-grid').empty().removeClass('d-none');
    $('#gallery-images').addClass('d-none');
    $('#gallery-album-info').addClass('d-none');

    if (mixed) {
      $grid.removeClass('row-cols-1 row-cols-sm-2 row-cols-md-3 g-4')
           .addClass('row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-2 gallery-grid--mixed');
    } else {
      $grid.removeClass('gallery-grid--mixed row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-2')
           .addClass('row-cols-1 row-cols-sm-2 row-cols-md-3 g-4');
    }

    renderBreadcrumb();

    children.folders.forEach(function (folder) {
      var $card = $('<div class="gallery-card gallery-card--folder d-flex flex-column h-100" role="button" tabindex="0">');
      $card.html(
        '<div class="gallery-card-img d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"><i data-lucide="folder-open" aria-hidden="true"></i></div>' +
        '<div class="gallery-card-body d-flex flex-column gap-1 flex-grow-1">' +
          '<div class="gallery-card-title fw-semibold text-truncate">' + esc(folder.name) + '</div>' +
          '<div class="gallery-card-meta">' + albumCountIn(folder.path) + ' Album(s)</div>' +
        '</div>'
      );
      $card.on('click keydown', (function (fp) {
        return function (e) { if (e.type === 'click' || e.key === 'Enter') { showFolder(fp); } };
      })(folder.path));
      $grid.append($('<div class="col">').append($card));
    });

    children.albums.forEach(function (album) {
      var $card = $('<div class="gallery-card d-flex flex-column h-100" role="button" tabindex="0">');
      var imgHtml = album.preview
        ? '<img src="galerie/' + esc(album.preview) + '" alt="' + esc(album.name) + '" loading="lazy" class="w-100 h-100 d-block object-fit-cover">'
        : '<i data-lucide="images" aria-hidden="true"></i>';
      var metaParts = [];
      if (album.dateCreated) { metaParts.push(egFormatDate(album.dateCreated)); }
      if (album.imageCount) { metaParts.push(album.imageCount + ' Fotos'); }
      if (hasChildren(album.path)) {
        var sub = childrenOf(album.path);
        var subCount = sub.albums.length + sub.folders.length;
        metaParts.push(subCount + (subCount === 1 ? ' Album' : ' Alben'));
      }
      var meta = metaParts.join(' &middot; ');
      $card.html(
        '<div class="gallery-card-img d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0">' + imgHtml + '</div>' +
        '<div class="gallery-card-body d-flex flex-column gap-1 flex-grow-1">' +
          '<div class="gallery-card-title fw-semibold text-truncate">' + esc(album.name) + '</div>' +
          '<div class="gallery-card-meta">' + meta + '</div>' +
          (!mixed && album.description ? '<div class="gallery-card-desc">' + esc(album.description) + '</div>' : '') +
        '</div>'
      );
      if (!mixed) { appendAlbumLinks($card, album); }
      $card.on('click keydown', (function (a) {
        return function (e) {
          if (e.type === 'click' || e.key === 'Enter') {
            if (hasChildren(a.path)) { showFolder(a.path); } else { openAlbum(a); }
          }
        };
      })(album));
      $grid.append($('<div class="col">').append($card));
    });

    if (window.lucide) { lucide.createIcons({ nodes: $grid[0].querySelectorAll('[data-lucide]') }); }

    if (mixed) {
      curAlbum = selfAlbum;
      var $loadingCol = $('<div class="col-12 text-center py-4">').html(
        '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Laden...</span></div>'
      );
      $grid.append($loadingCol);
      fetch('galerie/' + selfAlbum.path + '/_meta.json')
        .then(function (r) {
          if (!r.ok) { throw new Error('HTTP ' + r.status); }
          return r.json();
        })
        .then(function (meta) {
          lbImages = meta.hasPart || [];
          $loadingCol.remove();
          lbImages.forEach(function (img, i) {
            var $thumb = $('<div class="gallery-thumb" role="button" tabindex="0">');
            $thumb.attr('aria-label', 'Bild ' + (i + 1) + ' von ' + lbImages.length + ' offnen');
            $thumb.html('<img src="galerie/' + esc(selfAlbum.path) + '/' + esc(img.thumbnail) + '" alt="' + esc(img.caption || img.name) + '" loading="lazy">');
            $thumb.on('click keydown', (function (idx) {
              return function (e) { if (e.type === 'click' || e.key === 'Enter') { openLightbox(idx); } };
            })(i));
            $grid.append($('<div class="col">').append($thumb));
          });
        })
        .catch(function (err) {
          $loadingCol.html('<span class="text-muted">Fehler beim Laden: ' + esc(err.message) + '</span>');
        });
    }
  }

  // ── Album image grid ────────────────────────────────────────────────────────
  function openAlbum(album, autoOpenHash) {
    curAlbum = album;
    galleryRouteUpdate(album.path);
    renderBreadcrumb();
    $('#gallery-grid').addClass('d-none');
    var $imgSection = $('#gallery-images').removeClass('d-none');
    var $grid       = $('#gallery-thumb-grid').empty();
    $grid.html(
      '<div class="col-12 text-center py-5">' +
        '<div class="spinner-border text-primary" role="status">' +
          '<span class="visually-hidden">Laden...</span>' +
        '</div>' +
      '</div>'
    );

    fetch('galerie/' + album.path + '/_meta.json')
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (meta) {
        lbImages = meta.hasPart || [];

        // ── Album info box ──────────────────────────────────────────────────
        var infoMetaParts = [];
        if (meta.dateCreated) { infoMetaParts.push(egFormatDate(meta.dateCreated)); }
        infoMetaParts.push(lbImages.length + ' Fotos');
        $('#gallery-album-info-meta').text(infoMetaParts.join(' · '));

        var desc = meta.description || '';
        $('#gallery-album-info-desc')
          .toggleClass('d-none', !desc)
          .toggleClass('gallery-album-info-desc', !!desc)
          .text(desc);

        var keywords = Array.isArray(meta.keywords) ? meta.keywords : [];
        var $tags = $('#gallery-album-info-tags');
        if (keywords.length) {
          $tags.removeClass('d-none').empty();
          keywords.forEach(function (kw) {
            $tags.append($('<span class="badge rounded-pill me-1">').css({
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }).text(kw));
          });
        } else {
          $tags.addClass('d-none');
        }

        var wikiUrl  = meta['wiki-url']  || '';
        var rawUrl   = meta['raw-url']   || '';
        var cloudUrl = meta['cloud-url'] || '';
        var blogUrl  = meta['blog-url']  || '';
        var $links   = $('#gallery-album-info-links');
        $links.empty();
        if (wikiUrl) {
          $links.append($('<a>').attr({ href: wikiUrl, target: '_blank', rel: 'noopener noreferrer' })
            .addClass('btn btn-sm btn-outline-primary').text('Wiki'));
        }
        if (rawUrl) {
          $links.append($('<a>').attr({ href: rawUrl, target: '_blank', rel: 'noopener noreferrer' })
            .addClass('btn btn-sm btn-outline-secondary').text('Raw'));
        }
        if (cloudUrl) {
          $links.append($('<a>').attr({ href: cloudUrl, target: '_blank', rel: 'noopener noreferrer' })
            .addClass('btn btn-sm btn-outline-success').text('Cloud'));
        }
        if (blogUrl) {
          $links.append($('<a>').attr({ href: blogUrl, target: '_blank', rel: 'noopener noreferrer' })
            .addClass('btn btn-sm btn-outline-beitrag').text('Beitrag'));
        }
        var chronicleTypeClass = {
          blog: 'btn-outline-beitrag', wiki: 'btn-outline-primary',
          raw: 'btn-outline-secondary', cloud: 'btn-outline-success',
          social: 'btn-outline-info', extern: 'btn-outline-light'
        };
        var chronicleEntry = meta.chronicleId ? chronicleMap[meta.chronicleId] : null;
        if (chronicleEntry && Array.isArray(chronicleEntry.links)) {
          chronicleEntry.links.forEach(function (lnk) {
            if (!lnk.url || lnk.type === 'galerie') { return; }
            var cls = chronicleTypeClass[lnk.type] || 'btn-outline-secondary';
            $links.append($('<a>').attr({ href: lnk.url, target: '_blank', rel: 'noopener noreferrer' })
              .addClass('btn btn-sm ' + cls).text(lnk.title));
          });
        }
        if ($links.children().length) {
          $links.removeClass('d-none');
        } else {
          $links.addClass('d-none');
        }

        $('#gallery-album-info').removeClass('d-none');
        // ────────────────────────────────────────────────────────────────────

        $grid.empty();
        if (lbImages.length === 0) {
          $grid.html('<div class="col-12 text-muted text-center py-4">Keine Bilder in diesem Album.</div>');
          return;
        }
        if (autoOpenHash) {
          for (var ai = 0; ai < lbImages.length; ai++) {
            if (lbImages[ai].sourceHash === autoOpenHash) { openLightbox(ai); break; }
          }
        }
        lbImages.forEach(function (img, i) {
          var $col   = $('<div class="col-6 col-sm-4 col-md-3 col-lg-2">');
          var $thumb = $('<div class="gallery-thumb" role="button" tabindex="0">');
          $thumb.attr('aria-label', 'Bild ' + (i + 1) + ' von ' + lbImages.length + ' offnen');
          $thumb.html('<img src="galerie/' + esc(album.path) + '/' + esc(img.thumbnail) + '" alt="' + esc(img.caption || img.name) + '" loading="lazy">');
          $thumb.on('click keydown', (function (idx) {
            return function (e) { if (e.type === 'click' || e.key === 'Enter') { openLightbox(idx); } };
          })(i));
          $grid.append($col.append($thumb));
        });
      })
      .catch(function (err) {
        $grid.html('<div class="col-12 text-muted text-center py-4">Fehler beim Laden: ' + esc(err.message) + '</div>');
      });
  }

  // ── Lightbox ────────────────────────────────────────────────────────────────
  function openLightbox(idx) {
    lbIdx = idx;
    updateLightbox();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('gallery-lightbox')).show();
  }

  function updateLightbox() {
    var img    = lbImages[lbIdx];
    if (!img || !curAlbum) { return; }
    var imgSrc = 'galerie/' + curAlbum.path + '/' + img.name;
    $('#gallery-lb-img').attr('src', imgSrc).attr('alt', img.caption || img.name).removeAttr('aria-hidden');
    $('#gallery-lb-caption').text(img.caption || '');
    $('#gallery-lb-counter').text((lbIdx + 1) + ' / ' + lbImages.length);
    $('#gallery-lb-prev').prop('disabled', lbIdx === 0);
    $('#gallery-lb-next').prop('disabled', lbIdx === lbImages.length - 1);
    galleryRouteUpdate(curAlbum.path + '/' + img.sourceHash);
    $('#gallery-lb-download').attr('href', imgSrc).attr('download', img.name);
    var shareUrl = encodeURIComponent(window.location.href);
    $('#gallery-lb-wa').attr('href', 'https://wa.me/?text=' + shareUrl);
    $('#gallery-lb-tg').attr('href', 'https://t.me/share/url?url=' + shareUrl);
    $('#gallery-lb-mst').attr('href', 'https://mastodon.social/share?text=' + shareUrl);
    $('#gallery-lb-bsky').attr('href', 'https://bsky.app/intent/compose?text=' + shareUrl);
    $('#gallery-lb-mail').attr('href', 'mailto:?body=' + shareUrl);
  }

  $('#gallery-lb-prev').on('click', function () {
    if (lbIdx > 0) { lbIdx--; updateLightbox(); }
  });
  $('#gallery-lb-next').on('click', function () {
    if (lbIdx < lbImages.length - 1) { lbIdx++; updateLightbox(); }
  });
  $('#gallery-lightbox').on('keydown', function (e) {
    if (e.key === 'ArrowLeft'  && lbIdx > 0)                   { lbIdx--; updateLightbox(); }
    if (e.key === 'ArrowRight' && lbIdx < lbImages.length - 1) { lbIdx++; updateLightbox(); }
  });
  $('#gallery-lb-copy').on('click', function () {
    var $btn = $(this);
    var img    = lbImages[lbIdx];
    var imgUrl = new URL('galerie/' + curAlbum.path + '/' + img.name, window.location.href).href;
    navigator.clipboard.writeText(imgUrl).then(function () {
      $btn.html('<i data-lucide="check" aria-hidden="true"></i>');
      if (window.lucide) { lucide.createIcons({ nodes: [$btn[0]] }); }
      setTimeout(function () {
        $btn.html('<i data-lucide="image" aria-hidden="true"></i>');
        if (window.lucide) { lucide.createIcons({ nodes: [$btn[0]] }); }
      }, 1500);
    });
  });
  $('#gallery-lb-copy-link').on('click', function () {
    var $btn = $(this);
    navigator.clipboard.writeText(window.location.href).then(function () {
      $btn.html('<i data-lucide="check" aria-hidden="true"></i>');
      if (window.lucide) { lucide.createIcons({ nodes: [$btn[0]] }); }
      setTimeout(function () {
        $btn.html('<i data-lucide="link" aria-hidden="true"></i>');
        if (window.lucide) { lucide.createIcons({ nodes: [$btn[0]] }); }
      }, 1500);
    });
  });

  $('#gallery-lb-share').on('click', function (e) {
    e.stopPropagation();
    $('#gallery-lb-share-panel').toggleClass('open');
    $(this).attr('aria-expanded', $('#gallery-lb-share-panel').hasClass('open'));
  });
  $(document).on('click', function () {
    $('#gallery-lb-share-panel').removeClass('open');
    $('#gallery-lb-share').attr('aria-expanded', 'false');
  });
  $('#gallery-lb-share-panel').on('click', function (e) { e.stopPropagation(); });
  $('#gallery-lightbox').on('hide.bs.modal', function () {
    $('#gallery-lb-share-panel').removeClass('open');
    $('#gallery-lb-share').attr('aria-expanded', 'false');
  });

  $('#gallery-lightbox').on('hidden.bs.modal', function () {
    if (curAlbum) { galleryRouteUpdate(curAlbum.path); }
  });
  $('#tab-galerie-trigger').on('shown.bs.tab', function () {
    galleryRouteSync();
  });

  // ── Init ─────────────────────────────────────────────────────────────────────
  function galleryNavigateTo(path) {
    if (!path) { showFolder(''); return; }
    var parts = path.split('/');
    var last  = parts[parts.length - 1];
    // Last segment is a sourceHash (8 hex chars) → open album + lightbox
    if (/^[0-9a-f]{8}$/i.test(last) && parts.length >= 2) {
      var albumPath  = parts.slice(0, -1).join('/');
      var hashMatch  = albums.filter(function (a) { return a.path === albumPath; });
      if (hashMatch.length > 0) {
        curFolder = albumPath.lastIndexOf('/') !== -1 ? albumPath.slice(0, albumPath.lastIndexOf('/')) : '';
        openAlbum(hashMatch[0], last);
        return;
      }
    }
    // Path has child albums → show as folder (also handles mixed album+folder paths)
    if (hasChildren(path)) { showFolder(path); return; }
    // Path matches an album → open album
    var albumMatch = albums.filter(function (a) { return a.path === path; });
    if (albumMatch.length > 0) {
      curFolder = path.lastIndexOf('/') !== -1 ? path.slice(0, path.lastIndexOf('/')) : '';
      openAlbum(albumMatch[0]);
      return;
    }
    showFolder(path);
  }

  var initPath = (typeof route !== 'undefined') ? (route.galleryPath || '') : '';
  galleryNavigateTo(initPath);
})();
