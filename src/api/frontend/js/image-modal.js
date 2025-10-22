const modalImage = document.getElementById('modalImage');
const modalElement = document.getElementById('imageModal');
const modalBody = modalElement.querySelector('.modal-body');
const closeModalBtn = modalElement.querySelector('.close-modal-btn');

const bsModal = new bootstrap.Modal(modalElement, {
    backdrop: true,
    keyboard: true
});

function showImage(src, clickedEl) {
    const trigger = clickedEl?.closest('[data-bs-toggle="tooltip"]');

    if (trigger) {
        if (typeof trigger.blur === 'function') trigger.blur();

        const tt = bootstrap.Tooltip.getOrCreateInstance(trigger);

        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        try {
            if (isMobile) {
                tt.dispose();
            } else {
                tt.hide();
            }
        } catch (e) { }
    }

    modalImage.src = src;
    bsModal.show();
}

function closeModal() {
    bsModal.hide();
}

bsModal._element.addEventListener('show.bs.modal', () => {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) tooltip.hide();
        el.blur();
    });
});

closeModalBtn.addEventListener('click', closeModal);

modalBody.addEventListener('click', closeModal);