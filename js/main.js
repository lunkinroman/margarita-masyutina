(() => {
  'use strict';

  /* ---------- Хедер: белая плашка после прокрутки ---------- */

  const header = document.querySelector('.header');

  if (header) {
    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 0);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ---------- Мобильное меню ---------- */

  const burger = header && header.querySelector('.header__burger');
  const menu = document.getElementById('mobile-menu');

  if (header && burger && menu) {
    const setMenu = (open) => {
      header.classList.toggle('is-menu-open', open);
      document.documentElement.classList.toggle('is-scroll-locked', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };

    burger.addEventListener('click', () => {
      setMenu(!header.classList.contains('is-menu-open'));
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) setMenu(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });

    window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });
  }

  /* ---------- Видео на первом экране: при «Уменьшить движение» — стоп-кадр ---------- */

  const heroVideo = document.querySelector('.hero__video');

  if (heroVideo) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      if (reduceMotion.matches) {
        heroVideo.pause(); // до старта отменяет и autoplay — остаётся постер
      } else {
        heroVideo.play().catch(() => {}); // автозапуск запрещён (режим энергосбережения) — остаётся постер
      }
    };
    if (reduceMotion.matches) syncMotion();
    reduceMotion.addEventListener('change', syncMotion);
  }

  /* ---------- Разделы-папки: свернуть / развернуть ---------- */

  // Кнопка-шеврон растянута на всю полосу папки (CSS), ярлык с названием переключает её же
  document.querySelectorAll('.folder__toggle').forEach((toggle) => {
    const folder = toggle.closest('.folder');

    toggle.addEventListener('click', () => {
      const collapsed = folder.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });

    folder.querySelectorAll(':scope > .folder__tab, :scope > .folder__label').forEach((tab) => {
      tab.addEventListener('click', () => toggle.click());
    });
  });

  /* ---------- Слайдеры: факты об авторе, галерея и отзывы на странице книги ---------- */

  document.querySelectorAll('[data-slider]').forEach((slider) => {
    const track = slider.querySelector('.slider__track');
    const prev = slider.querySelector('.slider__btn--prev');
    const next = slider.querySelector('.slider__btn--next');
    // Точки могут стоять вне слайдера: <div data-slider-dots="id слайдера"> с кнопкой на каждый слайд
    const dots = slider.id ? [...document.querySelectorAll(`[data-slider-dots="${slider.id}"] button`)] : [];
    if (!track) return;

    const step = () => {
      const item = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    };

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = track.scrollLeft >= max - 1;
      slider.classList.toggle('is-start', track.scrollLeft <= 1);
      slider.classList.toggle('is-end', atEnd);

      if (dots.length) {
        // Последние слайды не встают к левому краю — в конце ленты активна последняя точка
        const current = atEnd ? dots.length - 1 : Math.round(track.scrollLeft / step());
        dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
      }
    };

    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => track.scrollTo({ left: i * step(), behavior: 'smooth' }));
    });

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Видео: плеер загружается по клику на обложку ---------- */

  // В data-video — ссылка на встраиваемый плеер (YouTube /embed/…, VK video_ext.php, Rutube /play/embed/…).
  // Пока ссылки нет, остаётся обложка из макета.
  document.querySelectorAll('[data-video]').forEach((video) => {
    const play = video.querySelector('.video__play');
    const src = video.dataset.video;
    if (!play || !src) return;

    play.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.className = 'video__frame';
      frame.src = src;
      frame.title = play.getAttribute('aria-label') || 'Видео';
      frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      video.replaceChildren(frame);
    });
  });

  /* ---------- Карточки-перевёртыши (курс): кнопка переворачивает, скрытая сторона недоступна с клавиатуры ---------- */

  document.querySelectorAll('[data-flip]').forEach((card) => {
    const faces = [card.querySelector('.case__face--front'), card.querySelector('.case__face--back')];
    const set = (flipped) => {
      card.classList.toggle('is-flipped', flipped);
      faces[0].inert = flipped;
      faces[1].inert = !flipped;
    };
    set(false);
    card.querySelectorAll('[data-flip-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const flipped = !card.classList.contains('is-flipped');
        set(flipped);
        faces[flipped ? 1 : 0].querySelector('[data-flip-toggle]').focus({ preventScroll: true });
      });
    });
  });

  /* ---------- Отзывы: «Читать полностью» у длинных ---------- */

  document.querySelectorAll('.review__text').forEach((text) => {
    const button = text.parentElement.querySelector('.review__more');
    if (!button) return;
    // Кнопка нужна, только если текст обрезан
    const sync = () => { button.hidden = text.scrollHeight <= text.clientHeight + 1 && !text.closest('.is-open'); };
    button.addEventListener('click', () => {
      const open = text.closest('.review').classList.toggle('is-open');
      button.textContent = open ? 'Свернуть' : 'Читать полностью';
      button.setAttribute('aria-expanded', String(open));
    });
    sync();
    if (document.fonts) document.fonts.ready.then(sync);
    window.addEventListener('resize', sync);
  });

  /* ---------- Окна: оплата «Дай пять!» через виджет GetCourse ---------- */

  // <template data-gc-widget> — код виджета из GetCourse как есть. Грузим его сразу после загрузки
  // страницы, как на Тильде: GetCourse отвечает несколько секунд, и к нажатию «Перейти к оплате»
  // форма уже готова. Скрипт GetCourse сам стартует на DOMContentLoaded, а вставленный позже —
  // по событию StartWidget<id>. Пока форма без высоты, в окне видно «Загружаем форму оплаты…»
  const loadWidget = (template) => {
    const code = template.content.querySelector('script[src]');
    if (!code) return;
    const box = document.createElement('div');
    const script = document.createElement('script');
    script.id = code.id;
    script.src = code.src;
    script.addEventListener('load', () => document.dispatchEvent(new Event('StartWidget' + script.id)));
    box.append(script);
    template.replaceWith(box);
  };

  const widgets = document.querySelectorAll('template[data-gc-widget]');

  widgets.forEach((template) => {
    const code = template.content.querySelector('script[src]');
    const loading = template.parentElement.querySelector('.modal__loading');
    if (!code || !loading) return;
    // Форма шлёт свою высоту раз в секунду, с первой же высотой строка загрузки прячется
    window.addEventListener('message', (event) => {
      if (event.data && event.data.uniqName === code.id) loading.hidden = event.data.height > 0;
    });
  });

  if (widgets.length) {
    const loadAll = () => widgets.forEach(loadWidget);
    if (document.readyState === 'complete') loadAll();
    else window.addEventListener('load', loadAll, { once: true });
  }

  document.querySelectorAll('[data-modal]').forEach((opener) => {
    const modal = document.getElementById(opener.dataset.modal);
    if (!modal || typeof modal.showModal !== 'function') return;
    opener.addEventListener('click', (event) => {
      event.preventDefault();
      modal.showModal();
    });
  });

  document.querySelectorAll('dialog.modal').forEach((modal) => {
    modal.querySelectorAll('[data-modal-close]').forEach((button) => button.addEventListener('click', () => modal.close()));
    // Клик по затемнению вокруг окна закрывает его
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });
  });

  /* ---------- Игра на весь экран ---------- */

  document.querySelectorAll('[data-fullscreen]').forEach((button) => {
    const frame = document.getElementById(button.dataset.fullscreen);
    if (!frame || !frame.requestFullscreen) {
      button.hidden = true;
      return;
    }
    button.addEventListener('click', () => frame.requestFullscreen().catch(() => {}));
  });

  /* ---------- Хлебные крошки: если не помещаются, видна текущая страница ---------- */

  const crumbs = document.querySelectorAll('.breadcrumbs');

  if (crumbs.length) {
    const showCurrent = () => crumbs.forEach((el) => { el.scrollLeft = el.scrollWidth; });
    showCurrent();
    if (document.fonts) document.fonts.ready.then(showCurrent);
    window.addEventListener('resize', showCurrent);
  }
})();
