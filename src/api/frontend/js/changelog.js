const imageHTML = `<span class="d-inline-block" tabindex="0" data-bs-toggle="tooltip" title="{name}" id="tooltip-test">
                                <img src="{url}" class="update-image"
                                    data-bs-toggle="modal" data-bs-target="#imageModal" onclick="showImage(this.src, this)"
                                    draggable="false" alt="{name}">
                            </span>`;

const updateCardHTML = `<div class="card mb-3 rounded-4 shadow-sm bg-card card-fix text update-card {class}"
                    id="{id}">
                    <div class="card-body">
                        <div class="mb-2">
                            {badges}
                        </div>
                        <h4 class="card-title d-flex align-items-center mb-2 update-container">
                            <span id="copyLinkTooltip-{id}">
                                <button id="copyLinkBtn-{id}" class="copy-link-btn"
                                    onclick="copyLink('{id}')">#</button>
                            </span>
                            <span class="badge bg-light text-dark version-badge">{version}</span>
                            <span style="margin-bottom: 0.25rem;">{title}</span>
                        </h4>

                        {body}

                        <div class="update-image-container mt-2 mb-1">
                            {images}
                        </div>

                        <small class="text-light">{date}</small>
                    </div>
                </div>`;

const systemItemHTML = `<div>
                            <span class="badge bg-light text-dark" style="opacity: 90%;">{version}</span>
                            <span class="system-title">{type}</span>
                            <ul>
                                {items}
                            </ul>
                        </div>`;

const noChangesHTML = `<div class="card mb-3 rounded-4 shadow-sm bg-card card-fix text">
                    <div class="card-header py-3">
                        <h4 class="my-0 text-center">Упс.. а тут пусто</h4>
                    </div>
                    <p class="text-center">Попробуете поискать позже?</p>
                </div>`;

const errorHTML = `<div class="card mb-3 rounded-4 shadow-sm bg-card card-fix text">
                    <div class="card-header py-3">
                        <h4 class="my-0 text-center">Упс.. при получении данных возникла ошибка</h4>
                    </div>
                    <p class="text-center">Попробуете поискать позже?</p>
                </div>`;

const badgesHTML = {
    major: `<span class="badge bg-info text-dark me-1">Крупное обновление</span>`,
    minor: `<span class="badge bg-secondary me-1">Обычное обновление</span>`,
    patch: `<span class="badge bg-secondary me-1">Небольшое обновление</span>`,
    hotfix: `<span class="badge bg-danger me-1">Хотфикс</span>`,
    api: `<span class="badge bg-light text-dark">API</span>`,
    website: `<span class="badge bg-light text-dark">Сайт</span>`,
    bot: `<span class="badge bg-light text-dark">Бот</span>`,
};

const systems = {
    api: 'API',
    bot: 'Бот',
    website: 'Сайт',
};

const container = document.querySelector('.container');

function copyLink(id) {
    const url = window.location.origin + window.location.pathname + '#' + id;

    navigator.clipboard.writeText(url).then(() => {
        const tooltipElement = document.getElementById(`copyLinkTooltip-${id}`);
        const tooltip = new bootstrap.Tooltip(tooltipElement, {
            title: 'Ссылка скопирована',
            trigger: 'manual',
            placement: 'top',
        });

        tooltip.show();

        setTimeout(() => {
            tooltip.hide();
        }, 1500);
    });
}

async function fetchChangelog() {
    // const response = await fetch(`http://127.0.0.1:4444/changelogs`, {
    //     method: 'GET',
    // });
    const response = await fetch(`https://api.schedule.rpcot.ru/changelogs`, {
        method: 'GET',
    });

    if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

    const responseData = await response.json();

    if (!responseData.ok)
        throw new Error(responseData.message);

    const data = responseData.data;

    for (const item of data) {
        const className = item.type === 'major' ? 'glowing-card' : '';
        const badges = badgesHTML[item.type] + item.involvedSystems.map((system) => badgesHTML[system]).join('\n');
        const images = item.images.map(img =>
            imageHTML.replaceAll('{name}', img.name).replace('{url}', img.url)
        ).join('\n');

        let body = '';
        for (const system of item.body) {
            body += systemItemHTML
                .replace('{version}', system.version)
                .replace('{type}', system.name)
                .replace('{items}', system.items.map(i =>
                    `<li>
                    ${i.split('\n').join('<br>')}
                    </li>`
                ).join('\n'));
        }

        const cardHTML = updateCardHTML
            .split('{id}').join(item.id)
            .replace('{version}', item.version)
            .replace('{class}', className)
            .replace('{title}', item.title)
            .replace('{body}', body)
            .replace('{date}', new Date(item.date).toLocaleDateString())
            .replace('{images}', images)
            .replace('{badges}', badges);

        container.insertAdjacentHTML('beforeend', cardHTML);
    }

    if (data.length === 0) {
        container.insertAdjacentHTML('beforeend', noChangesHTML);
    }

    syncTooltips();
}

function syncTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function scrollToHashAfterImages() {
    const hash = window.location.hash;
    if (!hash) return;

    const el = document.getElementById(hash.slice(1));
    if (!el) return;

    const images = document.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => img.onload = img.onerror = res);
    });

    Promise.all(promises).then(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        el.classList.add('update-card-pulse');
                        console.log(true);

                        setTimeout(() => el.classList.remove('update-card-pulse'), 350);
                    }, 250);

                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(el);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchChangelog();
        scrollToHashAfterImages();
    } catch (error) {
        console.error(error);
        container.insertAdjacentHTML('beforeend', errorHTML);
    } finally {
        document.getElementById('spinner').style.display = 'none';
    }
});