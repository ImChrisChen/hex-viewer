import { ref, computed, reactive, watch } from 'vue';
import { HexViewer } from '@imccc/hex-viewer-js/vue';
import bigData from '../comments.json';
// Sample Data
const samples = {
    hello: 'Hello, World! Greetings from HexViewer Vue Demo.\nThis is a high-performance hex viewer.',
    bigdata: bigData,
    binary: new Uint8Array([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F,
        0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2E, 0x2F,
        0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F,
        0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6, 0xF5, 0xF4, 0xF3, 0xF2, 0xF1, 0xF0,
    ]),
    unicode: '🚀 Unicode Test\nChinese: 你好世界\nEmoji: 😀😃😄😁😆😅🤣😂\nJapanese: こんにちは\nKorean: 안녕하세요\nRussian: Привет',
};
const lightTheme = {
    background: '#FFFFFF',
    text: '#000000',
    address: '#666666',
    dim: '#999999',
    selectionBg: '#0078D4',
    selectionFg: '#FFFFFF',
};
const darkTheme = {
    background: '#1E1E1E',
    text: '#FFFFFF',
    address: '#8EC0E4',
    dim: '#888888',
    selectionBg: '#0078D4',
    selectionFg: '#FFFFFF',
};
const sampleKey = ref('hello');
const customData = ref('');
const editableData = ref('');
const themePreset = ref('light');
const fontSize = ref(32);
const addressGap = ref(0.4);
const hexGap = ref(0.6);
const sectionGap = ref(1);
const colors = reactive({ ...lightTheme });
const copySuccess = ref(false);
// Convert to display text
function dataToDisplayText(value) {
    if (value instanceof Uint8Array) {
        return Array.from(value).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}
// Initialize editable data
watch(sampleKey, (key) => {
    if (key !== 'custom') {
        editableData.value = dataToDisplayText(samples[key]);
    }
}, { immediate: true });
const data = computed(() => {
    if (sampleKey.value === 'custom') {
        return customData.value;
    }
    // Use editable data
    return editableData.value;
});
const theme = computed(() => ({ ...colors }));
// Generate code example
const exampleCode = computed(() => {
    const themeCode = themePreset.value === 'light' ? 'light' : 'dark';
    const customTheme = Object.entries(colors)
        .map(([key, value]) => `    ${key}: '${value}'`)
        .join(',\n');
    return `<template>
  <HexViewer
    :data="data"
    themePreset="${themeCode}"
    :theme="customTheme"
    :fontPx="${fontSize.value}"
    :addressGapChars="${addressGap.value}"
    :hexGapChars="${hexGap.value}"
    :sectionGapChars="${sectionGap.value}"
  />
</template>

<script setup>
import { HexViewer } from '@imccc/hex-viewer-js/vue';

const data = \`${sampleKey.value === 'custom' ? customData.value.slice(0, 50) + '...' : editableData.value.slice(0, 50) + '...'}\`;

const customTheme = {
${customTheme}
};
<\/script>`;
});
function handleThemeChange(preset) {
    themePreset.value = preset;
    const newColors = preset === 'light' ? lightTheme : darkTheme;
    Object.assign(colors, newColors);
}
async function copyCode() {
    try {
        await navigator.clipboard.writeText(exampleCode.value);
        copySuccess.value = true;
        setTimeout(() => {
            copySuccess.value = false;
        }, 2000);
    }
    catch (err) {
        console.error('Copy failed:', err);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "main-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.sampleKey),
    ...{ class: "control-input" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "hello",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "bigdata",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "binary",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "unicode",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "custom",
});
if (__VLS_ctx.sampleKey === 'custom') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "control-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "control-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.customData),
        ...{ class: "control-input data-textarea" },
        placeholder: "Enter text or hex data...",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "control-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "control-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.editableData),
        ...{ class: "control-input data-textarea" },
        placeholder: "Edit to preview...",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "button-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.handleThemeChange('light');
        } },
    ...{ class: (['btn', __VLS_ctx.themePreset === 'light' ? 'btn-primary' : 'btn-secondary']) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.handleThemeChange('dark');
        } },
    ...{ class: (['btn', __VLS_ctx.themePreset === 'dark' ? 'btn-primary' : 'btn-secondary']) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "color",
    ...{ class: "control-input" },
});
(__VLS_ctx.colors.background);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "color",
    ...{ class: "control-input" },
});
(__VLS_ctx.colors.text);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "color",
    ...{ class: "control-input" },
});
(__VLS_ctx.colors.address);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "color",
    ...{ class: "control-input" },
});
(__VLS_ctx.colors.dim);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "color",
    ...{ class: "control-input" },
});
(__VLS_ctx.colors.selectionBg);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "color",
    ...{ class: "control-input" },
});
(__VLS_ctx.colors.selectionFg);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "range-value" },
});
(__VLS_ctx.fontSize);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "range",
    ...{ class: "control-input" },
    min: "8",
    max: "48",
});
(__VLS_ctx.fontSize);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "range-value" },
});
(__VLS_ctx.addressGap);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "range",
    ...{ class: "control-input" },
    min: "0",
    max: "8",
    step: "0.1",
});
(__VLS_ctx.addressGap);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "range-value" },
});
(__VLS_ctx.hexGap);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "range",
    ...{ class: "control-input" },
    min: "0",
    max: "4",
    step: "0.1",
});
(__VLS_ctx.hexGap);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-group" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "control-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "range-value" },
});
(__VLS_ctx.sectionGap);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "range",
    ...{ class: "control-input" },
    min: "0",
    max: "8",
    step: "0.1",
});
(__VLS_ctx.sectionGap);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.copyCode) },
    ...{ class: "copy-btn" },
    ...{ class: ({ 'copy-success': __VLS_ctx.copySuccess }) },
});
(__VLS_ctx.copySuccess ? '✓ Copied' : '📋 Copy Code');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "code-preview" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
(__VLS_ctx.exampleCode);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "viewer-container" },
});
const __VLS_0 = {}.HexViewer;
/** @type {[typeof __VLS_components.HexViewer, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "hex-viewer-wrapper" },
    data: (__VLS_ctx.data),
    themePreset: (__VLS_ctx.themePreset),
    theme: (__VLS_ctx.theme),
    fontPx: (__VLS_ctx.fontSize),
    addressGapChars: (__VLS_ctx.addressGap),
    hexGapChars: (__VLS_ctx.hexGap),
    sectionGapChars: (__VLS_ctx.sectionGap),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "hex-viewer-wrapper" },
    data: (__VLS_ctx.data),
    themePreset: (__VLS_ctx.themePreset),
    theme: (__VLS_ctx.theme),
    fontPx: (__VLS_ctx.fontSize),
    addressGapChars: (__VLS_ctx.addressGap),
    hexGapChars: (__VLS_ctx.hexGap),
    sectionGapChars: (__VLS_ctx.sectionGap),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['data-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['data-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['button-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['color-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['range-value']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['range-value']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['range-value']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-label']} */ ;
/** @type {__VLS_StyleScopedClasses['range-value']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-success']} */ ;
/** @type {__VLS_StyleScopedClasses['code-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['hex-viewer-wrapper']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            HexViewer: HexViewer,
            sampleKey: sampleKey,
            customData: customData,
            editableData: editableData,
            themePreset: themePreset,
            fontSize: fontSize,
            addressGap: addressGap,
            hexGap: hexGap,
            sectionGap: sectionGap,
            colors: colors,
            copySuccess: copySuccess,
            data: data,
            theme: theme,
            exampleCode: exampleCode,
            handleThemeChange: handleThemeChange,
            copyCode: copyCode,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
