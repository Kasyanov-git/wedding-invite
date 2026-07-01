/**
 * Основная логика приглашения:
 *  - открытие конверта
 *  - обратный отсчёт
 *  - анимации появления блоков
 *  - отправка формы RSVP
 */

(function () {
    const overlay = document.getElementById('envelope-overlay');
    const content = document.getElementById('invitation-content');
    const form = document.getElementById('rsvp-form');
    const submitBtn = document.getElementById('submit-btn');
    const successBlock = document.getElementById('form-success');
    const resetBtn = document.getElementById('btn-reset');
    const video = document.getElementById('bg-video');

    // ─────────────────────────────────────
    // 0. Видео-фон: проверка и fallback
    // ─────────────────────────────────────
    if (video) {
        const showVideo = () => {
            video.classList.add('ready');
            document.body.classList.add('video-ready');
        };

        const showFallback = () => {
            video.classList.remove('ready');
            document.body.classList.remove('video-ready');
        };

        video.addEventListener('canplaythrough', showVideo, { once: true });
        video.addEventListener('playing', showVideo, { once: true });
        video.addEventListener('error', showFallback, { once: true });
        video.addEventListener('stalled', showFallback, { once: true });

        // Если через 2 секунды видео так и не началось — показываем CSS-фallback
        setTimeout(() => {
            if (video.readyState < 3) showFallback();
        }, 2000);

        // Попытка запустить видео (особенно важно для iOS Safari)
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => showFallback());
        }
    }

    // ─────────────────────────────────────
    // 1. Видео-интро + CSS-fallback
    // ─────────────────────────────────────
    const introVideo = document.getElementById('envelope-intro');
    const fallbackEnvelope = document.querySelector('.envelope-fallback .envelope');

    let isVideoMode = false;
    let introStarted = false;

    function finishOpening() {
        if (!overlay || overlay.classList.contains('opened')) return;
        if (content) {
            content.classList.remove('hidden');
            requestAnimationFrame(() => {
                content.classList.add('visible');
            });
        }
        initScrollAnimations();
        setTimeout(() => {
            overlay.classList.add('opened');
        }, 600);
    }

    function startVideoIntro() {
        if (!overlay || overlay.classList.contains('opening')) return;
        overlay.classList.add('opening');
        finishOpening();
    }

    function startFallbackIntro() {
        document.body.classList.add('envelope-fallback-active');
        // Fallback: пользователь нажимает на CSS-конверт, как в старом варианте
    }

    if (introVideo) {
        // Видео-интро: автоматически после завершения — переход к приглашению
        introVideo.addEventListener('ended', () => {
            if (!introStarted) {
                introStarted = true;
                startVideoIntro();
            }
        }, { once: true });

        // Если видео не удалось загрузить/запустить — включаем fallback
        introVideo.addEventListener('error', () => {
            if (!introStarted) {
                introStarted = true;
                startFallbackIntro();
            }
        }, { once: true });

        introVideo.addEventListener('stalled', () => {
            if (!introStarted && introVideo.readyState < 2) {
                introStarted = true;
                startFallbackIntro();
            }
        }, { once: true });

        setTimeout(() => {
            if (!introStarted && introVideo.readyState < 2) {
                introStarted = true;
                startFallbackIntro();
            }
        }, 3000);

        // Страховка: если видео зависло и не вызвало ended
        setTimeout(() => {
            if (!overlay.classList.contains('opened')) {
                startVideoIntro();
            }
        }, 12000);
    } else {
        startFallbackIntro();
    }

    if (fallbackEnvelope) {
        fallbackEnvelope.addEventListener('click', () => {
            if (!overlay || overlay.classList.contains('opening')) return;
            overlay.classList.add('opening');
            setTimeout(() => {
                if (content) {
                    content.classList.remove('hidden');
                    requestAnimationFrame(() => {
                        content.classList.add('visible');
                    });
                }
                initScrollAnimations();
            }, 600);
            setTimeout(() => {
                overlay.classList.add('opened');
            }, 2400);
        });
        fallbackEnvelope.addEventListener('touchstart', (e) => {
            e.preventDefault();
            fallbackEnvelope.click();
        }, { passive: false });
    }

    // ─────────────────────────────────────
    // 2. Обратный отсчёт до даты
    // ─────────────────────────────────────
    const weddingDate = new Date('2026-09-11T16:00:00').getTime();
    const countdownEl = document.getElementById('countdown');

    function updateCountdown() {
        if (!countdownEl) return;
        const now = new Date().getTime();
        const diff = weddingDate - now;

        if (diff <= 0) {
            countdownEl.textContent = 'Сегодня великий день! 💍';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        const parts = [];
        if (days > 0) parts.push(plural(days, 'день', 'дня', 'дней'));
        if (hours > 0 || days > 0) parts.push(plural(hours, 'час', 'часа', 'часов'));
        parts.push(plural(minutes, 'минута', 'минуты', 'минут'));

        countdownEl.textContent = 'До торжества осталось: ' + parts.join(' ');
    }

    function plural(n, one, few, many) {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return n + ' ' + one;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + ' ' + few;
        return n + ' ' + many;
    }

    updateCountdown();
    setInterval(updateCountdown, 60000);

    // ─────────────────────────────────────
    // 3. Анимации появления блоков при скролле
    // ─────────────────────────────────────
    function initScrollAnimations() {
        const sections = document.querySelectorAll('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        sections.forEach(section => {
            section.classList.add('fade-in-up');
            observer.observe(section);
        });
    }

    // ─────────────────────────────────────
    // 4. Обработка формы RSVP
    // ─────────────────────────────────────
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const guestNames = Array.from(document.querySelectorAll('input[name="guest_name[]"]'))
                .map(input => input.value.trim())
                .filter(Boolean);

            const data = {
                full_name: formData.get('full_name')?.toString().trim(),
                attendance: formData.get('attendance')?.toString(),
                guests_count: parseInt(formData.get('guests_count') || '1', 10),
                guest_names: guestNames.join(', '),
                second_day: formData.get('second_day')?.toString() || '',
                drinks: collectCheckboxes('drinks'),
                food_preferences: collectCheckboxes('food_preferences'),
                allergies: formData.get('allergies')?.toString().trim(),
                wishes: formData.get('wishes')?.toString().trim(),
                contact: formData.get('contact')?.toString().trim(),
            };

            if (!data.full_name || !data.attendance) {
                alert('Пожалуйста, укажите имя и подтвердите участие.');
                return;
            }

            setLoading(true);

            try {
                const response = await fetch('/api/rsvp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showSuccess();
                } else {
                    throw new Error(result.error || 'Ошибка при отправке');
                }
            } catch (err) {
                console.error(err);
                alert('Не удалось отправить форму. Попробуйте ещё раз позже.');
            } finally {
                setLoading(false);
            }
        });
    }

    function collectCheckboxes(name) {
        const checked = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(cb => cb.value);
        return checked.join(', ');
    }

    function setLoading(loading) {
        if (!submitBtn) return;
        submitBtn.disabled = loading;
        submitBtn.classList.toggle('loading', loading);
    }

    function showSuccess() {
        if (form) form.style.display = 'none';
        if (successBlock) successBlock.style.display = 'block';
        successBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            form.style.display = 'grid';
            successBlock.style.display = 'none';
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // ─────────────────────────────────────
    // 5. Динамическое поведение формы
    // ─────────────────────────────────────
    const attendanceInputs = document.querySelectorAll('input[name="attendance"]');
    const guestsCountInput = document.getElementById('guests_count');
    const guestNamesContainer = document.getElementById('guest-names-container');
    const secondDayBlock = document.getElementById('second-day-block');

    function clampGuestsCount() {
        let value = parseInt(guestsCountInput.value, 10) || 1;
        value = Math.max(1, Math.min(value, 10));
        guestsCountInput.value = value;
        return value;
    }

    function updateGuestNames() {
        if (!guestNamesContainer || !guestsCountInput) return;
        const count = clampGuestsCount();
        const needed = Math.max(0, count - 1);

        // Удаляем лишние поля (динамически пересчитываем список)
        let fields = Array.from(guestNamesContainer.querySelectorAll('.guest-name-field'));
        while (fields.length > needed) {
            fields[fields.length - 1].remove();
            fields = Array.from(guestNamesContainer.querySelectorAll('.guest-name-field'));
        }

        // Добавляем недостающие поля
        while (fields.length < needed) {
            const idx = fields.length + 2;
            const group = document.createElement('div');
            group.className = 'form-group guest-name-field';
            group.innerHTML = `
                <label for="guest_name_${idx}">Фамилия и имя гостя №${idx}</label>
                <input type="text" id="guest_name_${idx}" name="guest_name[]" required placeholder="Гость ${idx}">
            `;
            guestNamesContainer.appendChild(group);
            fields = Array.from(guestNamesContainer.querySelectorAll('.guest-name-field'));
        }

        // Перенумеровываем поля на случай, если порядок нарушился
        fields = Array.from(guestNamesContainer.querySelectorAll('.guest-name-field'));
        fields.forEach((field, i) => {
            const num = i + 2;
            const label = field.querySelector('label');
            const input = field.querySelector('input');
            if (label) label.textContent = `Фамилия и имя гостя №${num}`;
            if (input) {
                input.placeholder = `Гость ${num}`;
                input.id = `guest_name_${num}`;
            }
        });
    }

    function updateSecondDayBlock() {
        if (!secondDayBlock) return;
        const selected = document.querySelector('input[name="attendance"]:checked');
        if (selected && (selected.value === 'confirmed' || selected.value === 'maybe')) {
            secondDayBlock.style.display = 'block';
        } else {
            secondDayBlock.style.display = 'none';
            // Сбрасываем выбор второго дня, если вопрос скрыт
            secondDayBlock.querySelectorAll('input[name="second_day"]').forEach(r => r.checked = false);
        }
    }

    if (guestsCountInput) {
        guestsCountInput.addEventListener('input', () => {
            clampGuestsCount();
            updateGuestNames();
        });
        guestsCountInput.addEventListener('change', () => {
            clampGuestsCount();
            updateGuestNames();
        });
    }

    attendanceInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.value === 'declined' && input.checked) {
                guestsCountInput.value = 1;
                guestsCountInput.disabled = true;
            } else if (input.checked) {
                guestsCountInput.value = Math.max(1, Math.min(parseInt(guestsCountInput.value) || 1, 10));
                guestsCountInput.disabled = false;
            }
            updateGuestNames();
            updateSecondDayBlock();
        });
    });

})();
