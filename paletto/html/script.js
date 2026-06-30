document.addEventListener('DOMContentLoaded', () => {
    const paletteContainer = document.getElementById('palette-main');
    const addBtn = document.getElementById('add-col');
    const removeBtn = document.getElementById('remove-col');
    const colCountDisplay = document.getElementById('col-count');
    const generateHarmonyBtn = document.getElementById('generate-harmony');
    const copyAllBtn = document.getElementById('copy-all');
    const exportPaletteBtn = document.getElementById('export-palette');
    const importPaletteBtn = document.getElementById('import-palette');
    const importPaletteInput = document.getElementById('import-palette-input');
    const resetPaletteBtn = document.getElementById('reset-palette');

    let columnCount = 5;
    let generationStep = Math.floor(Math.random() * 100);
    const MIN_COLUMNS = 3;
    const MAX_COLUMNS = 7;
    const HARMONY_RECIPES = {
        3: [
            {
                name: 'analogous-3',
                offsets: [-28, 0, 28],
                saturation: [68, 72, 66],
                lightness: [54, 48, 58]
            },
            {
                name: 'split-complementary',
                offsets: [0, 148, 212],
                saturation: [72, 63, 65],
                lightness: [48, 56, 52]
            },
            {
                name: 'triadic',
                offsets: [0, 118, 242],
                saturation: [70, 64, 67],
                lightness: [47, 56, 52]
            }
        ],
        4: [
            {
                name: 'analogous-4',
                offsets: [-42, -14, 14, 42],
                saturation: [66, 72, 70, 64],
                lightness: [55, 48, 52, 58]
            },
            {
                name: 'tetradic',
                offsets: [0, 86, 180, 266],
                saturation: [72, 64, 60, 66],
                lightness: [46, 56, 52, 58]
            },
            {
                name: 'split-bridge',
                offsets: [-18, 0, 150, 210],
                saturation: [64, 72, 62, 64],
                lightness: [58, 47, 55, 52]
            }
        ],
        5: [
            {
                name: 'analogous-5',
                offsets: [-54, -24, 0, 24, 54],
                saturation: [62, 68, 74, 68, 62],
                lightness: [58, 52, 46, 52, 58]
            },
            {
                name: 'tetradic-bridge',
                offsets: [-18, 0, 88, 182, 270],
                saturation: [64, 72, 63, 58, 65],
                lightness: [58, 46, 56, 52, 58]
            },
            {
                name: 'split-support',
                offsets: [-26, 0, 26, 150, 210],
                saturation: [64, 72, 66, 61, 63],
                lightness: [58, 46, 54, 56, 52]
            }
        ],
        6: [
            {
                name: 'analogous-6',
                offsets: [-60, -36, -12, 12, 36, 60],
                saturation: [60, 66, 72, 74, 68, 62],
                lightness: [58, 53, 48, 46, 52, 57]
            },
            {
                name: 'hexadic',
                offsets: [0, 60, 120, 180, 240, 300],
                saturation: [72, 64, 68, 66, 70, 62],
                lightness: [48, 55, 50, 53, 47, 56]
            }
        ],
        7: [
            {
                name: 'analogous-7',
                offsets: [-72, -48, -24, 0, 24, 48, 72],
                saturation: [58, 63, 68, 74, 68, 63, 58],
                lightness: [60, 55, 50, 45, 50, 55, 60]
            },
            {
                name: 'heptadic',
                offsets: [0, 52, 104, 156, 208, 260, 312],
                saturation: [72, 66, 62, 60, 62, 66, 72],
                lightness: [46, 52, 56, 58, 56, 52, 46]
            }
        ]
    };

    initPalette();

    addBtn.addEventListener('click', () => {
        if (columnCount < MAX_COLUMNS) {
            columnCount++;
            addColumn();
            updateControls();
        }
    });

    removeBtn.addEventListener('click', () => {
        if (columnCount > MIN_COLUMNS) {
            columnCount--;
            removeColumn();
            updateControls();
        }
    });

    generateHarmonyBtn.addEventListener('click', () => {
        const targetCount = getGenerationColumnCount();
        const colors = buildHarmonyPalette(targetCount, generationStep);

        applyGeneratedPalette(colors);
        generationStep++;
        flashButton(generateHarmonyBtn);
    });

    resetPaletteBtn.addEventListener('click', () => {
        const sections = paletteContainer.querySelectorAll('.color-section');
        sections.forEach((section) => {
            const hexInput = section.querySelector('.hex-input');
            const colorPicker = section.querySelector('.color-picker');
            updateColor(section, hexInput, '#ffffff');
            colorPicker.value = '#ffffff';
        });
        flashButton(resetPaletteBtn);
    });

    copyAllBtn.addEventListener('click', async () => {
        const colors = Array.from(paletteContainer.children).map((section) => getSectionHex(section));
        const hexString = colors.join(' ');

        try {
            await navigator.clipboard.writeText(hexString);
            flashButton(copyAllBtn);
        } catch (_) {
            alert('Nao foi possivel copiar a paleta para o clipboard.');
        }
    });

    exportPaletteBtn.addEventListener('click', () => {
        const palette = getCurrentPalette();
        const blob = new Blob([JSON.stringify({ colors: palette }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `paleta-${palette.length}-cores.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        flashButton(exportPaletteBtn);
    });

    importPaletteBtn.addEventListener('click', () => {
        importPaletteInput.click();
    });

    importPaletteInput.addEventListener('change', async (event) => {
        const [file] = event.target.files;
        if (!file) return;

        try {
            const content = await file.text();
            const parsed = JSON.parse(content);
            const colors = Array.isArray(parsed) ? parsed : parsed.colors;

            applyImportedPalette(colors);
            flashButton(importPaletteBtn);
        } catch (_) {
            alert('Arquivo de paleta invalido. Use um JSON com uma lista de cores hex.');
        } finally {
            importPaletteInput.value = '';
        }
    });

    generateHarmonyBtn.click();

    function initPalette() {
        paletteContainer.innerHTML = '';
        for (let i = 0; i < columnCount; i++) {
            addColumn(false);
        }
        updateControls();
    }

    function addColumn(animate = true) {
        const id = Date.now() + Math.random().toString(36).slice(2, 11);
        const section = document.createElement('section');
        section.className = 'color-section';
        if (animate) section.classList.add('entering');
        section.style.backgroundColor = '#ffffff';
        section.id = `section-${id}`;

        section.innerHTML = `
            <div class="controls">
                <input type="text" class="hex-input" value="#ffffff" id="input-${id}" spellcheck="false" maxlength="7">
                <button class="picker-btn" id="btn-${id}" aria-label="Escolher cor">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 5 5"/><path d="m5.2 9.6 3.2 3.2"/></svg>
                </button>
                <button class="screen-picker-btn" id="screen-btn-${id}" aria-label="Capturar cor da tela">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <input type="color" class="color-picker" id="picker-${id}" value="#ffffff">
            </div>
        `;

        paletteContainer.appendChild(section);
        setupColumnEvents(id, section);

        if (animate) {
            setTimeout(() => {
                section.classList.remove('entering');
            }, 10);
        }

        updateContrast(section, '#ffffff');
    }

    function removeColumn() {
        const lastSection = paletteContainer.lastElementChild;
        if (lastSection) {
            lastSection.classList.add('entering');
            setTimeout(() => {
                lastSection.remove();
            }, 500);
        }
    }

    function setupColumnEvents(id, section) {
        const hexInput = document.getElementById(`input-${id}`);
        const pickerBtn = document.getElementById(`btn-${id}`);
        const colorPicker = document.getElementById(`picker-${id}`);
        const screenBtn = document.getElementById(`screen-btn-${id}`);

        pickerBtn.addEventListener('click', () => colorPicker.click());

        screenBtn.addEventListener('click', async () => {
            try {
                const hex = await openScreenColorPicker();
                if (!hex) return;

                updateColor(section, hexInput, hex);
                colorPicker.value = hex;
                flashButton(screenBtn);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    alert('Nao foi possivel capturar a tela. Abra o projeto via http://localhost e permita o compartilhamento de tela.');
                }
            }
        });

        colorPicker.addEventListener('input', (e) => {
            updateColor(section, hexInput, e.target.value.toLowerCase());
        });

        hexInput.addEventListener('input', (e) => {
            let color = e.target.value;
            if (color.length > 0 && color[0] !== '#') {
                color = `#${color}`;
                hexInput.value = color;
            }

            if (/^#[0-9A-F]{6}$/i.test(color)) {
                updateColor(section, colorPicker, color.toLowerCase());
            }
        });

        hexInput.addEventListener('keypress', (e) => {
            if (!/[0-9A-Fa-f#]/.test(String.fromCharCode(e.which))) e.preventDefault();
        });
    }

    async function openScreenColorPicker() {
        if (!navigator.mediaDevices?.getDisplayMedia) {
            throw new Error('getDisplayMedia unavailable');
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

        try {
            const frame = await captureStreamFrame(stream);
            return await showScreenPickerOverlay(frame.canvas);
        } finally {
            stream.getTracks().forEach((track) => track.stop());
        }
    }

    async function captureStreamFrame(stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
        });

        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        video.pause();
        video.srcObject = null;

        return { canvas, context };
    }

    function showScreenPickerOverlay(sourceCanvas) {
        return new Promise((resolve, reject) => {
            const overlay = document.createElement('div');
            overlay.className = 'screen-picker-overlay';
            overlay.innerHTML = `
                <div class="screen-picker-panel">
                    <div class="screen-picker-header">
                        <strong>Clique na cor desejada</strong>
                        <button type="button" class="screen-picker-close" aria-label="Fechar captura">Fechar</button>
                    </div>
                    <div class="screen-picker-hint">A captura fica congelada para voce selecionar o pixel com precisao.</div>
                    <div class="screen-picker-stage">
                        <canvas class="screen-picker-canvas"></canvas>
                        <div class="screen-picker-loupe" aria-hidden="true">
                            <canvas class="screen-picker-zoom" width="120" height="120"></canvas>
                            <span class="screen-picker-hex">#FFFFFF</span>
                        </div>
                    </div>
                </div>
            `;

            const closeBtn = overlay.querySelector('.screen-picker-close');
            const stage = overlay.querySelector('.screen-picker-stage');
            const canvas = overlay.querySelector('.screen-picker-canvas');
            const loupe = overlay.querySelector('.screen-picker-loupe');
            const zoomCanvas = overlay.querySelector('.screen-picker-zoom');
            const hexLabel = overlay.querySelector('.screen-picker-hex');
            const context = canvas.getContext('2d');
            const zoomContext = zoomCanvas.getContext('2d', { willReadFrequently: true });
            const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });

            let isClosed = false;

            document.body.appendChild(overlay);

            const maxWidth = window.innerWidth - 80;
            const maxHeight = window.innerHeight - 180;
            const scale = Math.min(maxWidth / sourceCanvas.width, maxHeight / sourceCanvas.height, 1);
            const displayWidth = Math.max(320, Math.floor(sourceCanvas.width * scale));
            const displayHeight = Math.max(180, Math.floor(sourceCanvas.height * scale));

            canvas.width = displayWidth;
            canvas.height = displayHeight;
            context.drawImage(sourceCanvas, 0, 0, displayWidth, displayHeight);

            function closePicker(error) {
                if (isClosed) return;
                isClosed = true;
                overlay.remove();
                if (error) reject(error);
            }

            function getHexAt(event) {
                const rect = canvas.getBoundingClientRect();
                const x = Math.max(0, Math.min(rect.width - 1, event.clientX - rect.left));
                const y = Math.max(0, Math.min(rect.height - 1, event.clientY - rect.top));
                const sourceX = Math.max(0, Math.min(sourceCanvas.width - 1, Math.floor((x / rect.width) * sourceCanvas.width)));
                const sourceY = Math.max(0, Math.min(sourceCanvas.height - 1, Math.floor((y / rect.height) * sourceCanvas.height)));
                const pixel = sourceContext.getImageData(sourceX, sourceY, 1, 1).data;
                const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

                return { x, y, sourceX, sourceY, hex };
            }

            function drawLoupe(point) {
                const sampleSize = 12;
                const startX = Math.max(0, Math.min(sourceCanvas.width - sampleSize, point.sourceX - Math.floor(sampleSize / 2)));
                const startY = Math.max(0, Math.min(sourceCanvas.height - sampleSize, point.sourceY - Math.floor(sampleSize / 2)));

                zoomContext.imageSmoothingEnabled = false;
                zoomContext.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
                zoomContext.drawImage(
                    sourceCanvas,
                    startX,
                    startY,
                    sampleSize,
                    sampleSize,
                    0,
                    0,
                    zoomCanvas.width,
                    zoomCanvas.height
                );

                zoomContext.strokeStyle = '#ffffff';
                zoomContext.lineWidth = 2;
                zoomContext.strokeRect(50, 50, 20, 20);

                hexLabel.textContent = point.hex.toUpperCase();
                loupe.style.left = `${point.x + 24}px`;
                loupe.style.top = `${point.y + 24}px`;
                loupe.classList.add('visible');
            }

            canvas.addEventListener('mousemove', (event) => {
                drawLoupe(getHexAt(event));
            });

            canvas.addEventListener('mouseleave', () => {
                loupe.classList.remove('visible');
            });

            canvas.addEventListener('click', (event) => {
                const point = getHexAt(event);
                closePicker();
                resolve(point.hex.toLowerCase());
            });

            closeBtn.addEventListener('click', () => {
                closePicker(new DOMException('Selection cancelled', 'AbortError'));
            });

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    closePicker(new DOMException('Selection cancelled', 'AbortError'));
                }
            });

            document.addEventListener(
                'keydown',
                (event) => {
                    if (event.key === 'Escape') {
                        closePicker(new DOMException('Selection cancelled', 'AbortError'));
                    }
                },
                { once: true }
            );

            stage.scrollTop = 0;
            stage.scrollLeft = 0;
        });
    }

    function flashButton(button) {
        button.style.background = 'rgba(74, 197, 94, 0.4)';
        setTimeout(() => {
            button.style.background = '';
        }, 800);
    }

    function getCurrentPalette() {
        return Array.from(paletteContainer.children).map((section) => getSectionHex(section));
    }

    function applyImportedPalette(colors) {
        if (!Array.isArray(colors)) {
            throw new Error('Invalid palette format');
        }

        const validColors = colors
            .map((color) => String(color).trim().toUpperCase())
            .filter((color) => /^#[0-9A-F]{6}$/.test(color));

        if (validColors.length < MIN_COLUMNS || validColors.length > MAX_COLUMNS) {
            throw new Error('Palette size out of bounds');
        }

        columnCount = validColors.length;
        paletteContainer.innerHTML = '';

        validColors.forEach((color) => {
            addColumn(false);
            const section = paletteContainer.lastElementChild;
            const hexInput = section.querySelector('.hex-input');
            const colorPicker = section.querySelector('.color-picker');
            updateColor(section, hexInput, color.toLowerCase());
            colorPicker.value = color.toLowerCase();
        });

        updateControls();
    }

    function getSectionHex(section) {
        const bg = section.style.backgroundColor;
        if (bg.startsWith('#')) return bg.toUpperCase();

        const rgb = bg.match(/\d+/g);
        if (!rgb) return '#FFFFFF';

        return rgbToHex(Number(rgb[0]), Number(rgb[1]), Number(rgb[2]));
    }

    function rgbToHex(r, g, b) {
        return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    }

    function updateColor(section, syncElement, color) {
        section.style.backgroundColor = color;
        syncElement.value = color;
        updateContrast(section, color);
    }

    function updateContrast(section, hex) {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        if (yiq >= 128) {
            section.classList.remove('light-text');
            section.classList.add('dark-text');
        } else {
            section.classList.remove('dark-text');
            section.classList.add('light-text');
        }
    }

    function updateControls() {
        colCountDisplay.textContent = columnCount;
        removeBtn.disabled = columnCount <= MIN_COLUMNS;
        addBtn.disabled = columnCount >= MAX_COLUMNS;
    }

    function getGenerationColumnCount() {
        if (columnCount <= 3) return 3;
        if (columnCount === 4) return 4;
        return Math.min(columnCount, 7);
    }

    function applyGeneratedPalette(colors) {
        if (!Array.isArray(colors) || colors.length < 3 || colors.length > 7) {
            throw new Error('Generated palette out of bounds');
        }

        const oldCount = paletteContainer.children.length;
        const newCount = colors.length;
        columnCount = newCount;

        // Update existing sections in-place for smooth CSS transition
        const existing = Array.from(paletteContainer.children);
        for (let i = 0; i < Math.min(existing.length, newCount); i++) {
            const section = existing[i];
            const hexInput = section.querySelector('.hex-input');
            const colorPicker = section.querySelector('.color-picker');
            updateColor(section, hexInput, colors[i]);
            colorPicker.value = colors[i];
        }

        // Remove extra sections with animation
        const toRemove = existing.length - newCount;
        for (let i = 0; i < toRemove; i++) {
            const section = paletteContainer.lastElementChild;
            section.classList.add('entering');
            setTimeout(() => section.remove(), 500);
        }

        // Add new sections if needed
        for (let i = oldCount; i < newCount; i++) {
            addColumn(false);
            const section = paletteContainer.lastElementChild;
            const hexInput = section.querySelector('.hex-input');
            const colorPicker = section.querySelector('.color-picker');
            updateColor(section, hexInput, colors[i]);
            colorPicker.value = colors[i];
        }

        updateControls();
    }

    function buildHarmonyPalette(count, step) {
        const recipes = HARMONY_RECIPES[count] || HARMONY_RECIPES[5];
        const recipe = recipes[step % recipes.length];
        const baseHue = resolveBaseHue(step);

        return recipe.offsets.map((offset, index) => {
            const hue = normalizeHue(baseHue + offset + getHueJitter(step, index));
            const saturation = clamp(recipe.saturation[index] + getSatLightJitter(step, index, 5), 60, 78);
            const lightness = clamp(recipe.lightness[index] + getSatLightJitter(step + 2, index, 4), 42, 66);
            const refined = refineHarmonyColor(hue, saturation, lightness, index, count);

            return hslToHex(refined.h, refined.s, refined.l);
        });
    }

    function resolveBaseHue(step) {
        const currentPalette = getCurrentPalette();
        const firstMeaningfulColor = currentPalette.find((color) => color && color !== '#FFFFFF');

        if (firstMeaningfulColor) {
            const currentHue = hexToHsl(firstMeaningfulColor).h;
            return normalizeHue(currentHue + (step * 37));
        }

        return normalizeHue(28 + (step * 137.508));
    }

    function getHueJitter(step, index) {
        const pattern = [-6, 0, 5, -3, 4];
        return pattern[(step + index) % pattern.length];
    }

    function getSatLightJitter(step, index, amplitude) {
        const pattern = [-1, 2, -2, 1, 0];
        return pattern[(step + index) % pattern.length] * amplitude * 0.5;
    }

    function refineHarmonyColor(hue, saturation, lightness, index, count) {
        let nextHue = hue;
        let nextSaturation = saturation;
        let nextLightness = lightness;

        if (hue >= 35 && hue <= 65) {
            nextHue += hue < 50 ? -8 : 8;
            nextSaturation += 4;
        }

        if (hue >= 100 && hue <= 140) {
            nextHue += hue < 120 ? -6 : 6;
            nextLightness -= 2;
        }

        if (hue >= 180 && hue <= 205) {
            nextHue += 10;
            nextSaturation += 3;
        }

        if (index === Math.floor(count / 2)) {
            nextSaturation += 2;
            nextLightness -= 2;
        }

        return {
            h: normalizeHue(nextHue),
            s: clamp(nextSaturation, 58, 80),
            l: clamp(nextLightness, 40, 68)
        };
    }

    function normalizeHue(hue) {
        return ((hue % 360) + 360) % 360;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function hexToHsl(hex) {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const lightness = (max + min) / 2;
        let hue = 0;
        let saturation = 0;

        if (delta !== 0) {
            saturation = delta / (1 - Math.abs((2 * lightness) - 1));

            switch (max) {
                case r:
                    hue = 60 * (((g - b) / delta) % 6);
                    break;
                case g:
                    hue = 60 * (((b - r) / delta) + 2);
                    break;
                default:
                    hue = 60 * (((r - g) / delta) + 4);
                    break;
            }
        }

        return {
            h: normalizeHue(hue),
            s: Math.round(saturation * 100),
            l: Math.round(lightness * 100)
        };
    }

    function hslToHex(h, s, l) {
        const saturation = clamp(s, 0, 100) / 100;
        const lightness = clamp(l, 0, 100) / 100;
        const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
        const hueSegment = normalizeHue(h) / 60;
        const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1));
        const match = lightness - (chroma / 2);
        let red = 0;
        let green = 0;
        let blue = 0;

        if (hueSegment >= 0 && hueSegment < 1) {
            red = chroma;
            green = secondary;
        } else if (hueSegment < 2) {
            red = secondary;
            green = chroma;
        } else if (hueSegment < 3) {
            green = chroma;
            blue = secondary;
        } else if (hueSegment < 4) {
            green = secondary;
            blue = chroma;
        } else if (hueSegment < 5) {
            red = secondary;
            blue = chroma;
        } else {
            red = chroma;
            blue = secondary;
        }

        return rgbToHex(
            Math.round((red + match) * 255),
            Math.round((green + match) * 255),
            Math.round((blue + match) * 255)
        );
    }
});
