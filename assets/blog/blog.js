// Metric AI Lab — blog behaviour (menu, tag filters, TOC scroll-spy, chart toggle)
(function () {
    // Mobile menu
    var burger = document.getElementById('hamburger');
    var menu = document.getElementById('mobile-menu');
    if (burger && menu) {
        burger.addEventListener('click', function () { menu.classList.toggle('open'); });
        menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { menu.classList.remove('open'); });
        });
    }

    // Tag filters on the blog index. Cards carry data-tag; chips carry data-filter.
    // Chips for tags with no posts hide themselves, so new tags "just appear".
    var chips = document.querySelectorAll('.chip[data-filter]');
    if (chips.length) {
        var items = document.querySelectorAll('[data-tag]');
        var empty = document.querySelector('.empty-state');
        var countEl = document.getElementById('post-count');
        chips.forEach(function (chip) {
            var f = chip.dataset.filter;
            var n = f === 'all' ? items.length : document.querySelectorAll('[data-tag~="' + f + '"]').length;
            var c = chip.querySelector('.count');
            if (c) c.textContent = n;
            if (n === 0 && f !== 'all') chip.hidden = true;
            chip.addEventListener('click', function () {
                chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === chip)); });
                var shown = 0;
                items.forEach(function (el) {
                    var ok = f === 'all' || el.dataset.tag.split(' ').indexOf(f) > -1;
                    el.style.display = ok ? '' : 'none';
                    if (ok) shown++;
                });
                if (empty) empty.style.display = shown ? 'none' : 'block';
                if (countEl) countEl.textContent = shown;
                if (history.replaceState) history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
            });
        });
        var initial = location.hash.slice(1);
        var start = initial && document.querySelector('.chip[data-filter="' + initial + '"]');
        if (start && !start.hidden) start.click();
    }

    // TOC scroll-spy
    var toc = document.querySelector('.toc');
    if (toc && 'IntersectionObserver' in window) {
        var links = toc.querySelectorAll('a[href^="#"]');
        var map = {};
        links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
        var heads = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
        var setActive = function (id) {
            links.forEach(function (a) { a.classList.toggle('active', a === map[id]); });
        };
        var io = new IntersectionObserver(function () {
            var current = heads[0];
            heads.forEach(function (h) { if (h.getBoundingClientRect().top < 140) current = h; });
            if (current) setActive(current.id);
        }, { rootMargin: '-100px 0px -60% 0px', threshold: [0, 1] });
        heads.forEach(function (h) { io.observe(h); });
        window.addEventListener('scroll', function () {
            var current = heads[0];
            heads.forEach(function (h) { if (h.getBoundingClientRect().top < 140) current = h; });
            if (current) setActive(current.id);
        }, { passive: true });
    }

    // Grouped bar chart: toggle metric (WER / CER). Data lives on each .bar-line.
    document.querySelectorAll('.bars[data-metrics]').forEach(function (chart) {
        var buttons = chart.querySelectorAll('.seg-toggle button');
        // Optional per-metric formatting: data-units='{"ttfa":" ms"}' data-decimals='{"ttfa":0}'. Default: "%", 2 decimals.
        var units = JSON.parse(chart.dataset.units || '{}');
        var decimals = JSON.parse(chart.dataset.decimals || '{}');
        var fmt = function (metric, v) {
            var d = metric in decimals ? decimals[metric] : 2;
            return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + (metric in units ? units[metric] : '%');
        };
        var render = function (metric) {
            var lines = chart.querySelectorAll('.bar-line');
            var max = 0;
            lines.forEach(function (l) { max = Math.max(max, parseFloat(l.dataset[metric])); });
            lines.forEach(function (l) {
                var v = parseFloat(l.dataset[metric]);
                l.querySelector('.bar').style.width = (v / max * 82) + '%';
                l.querySelector('.bar-val').textContent = fmt(metric, v);
                var btn = chart.querySelector('.seg-toggle button[data-metric="' + metric + '"]');
                l.title = l.dataset.series + ' · ' + l.closest('.bar-row').querySelector('.bar-label').textContent + ' · ' + (btn ? btn.textContent : metric) + ' ' + fmt(metric, v);
            });
            buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.metric === metric)); });
        };
        buttons.forEach(function (b) { b.addEventListener('click', function () { render(b.dataset.metric); }); });
        render(chart.dataset.metrics.split(',')[0]);
    });
})();
