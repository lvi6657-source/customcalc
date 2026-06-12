import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Grid, List, Edit2, X, Download, Upload, Settings, FileJson, Sparkles, Type, ArrowLeft, Trash2, Minus, ChevronDown, ChevronRight, RotateCcw, ChevronLeft, Info, Wrench } from 'lucide-react';
import { FormulaEditor } from './components/FormulaEditor';
import { FormulaRunner } from './components/FormulaRunner';
import { Formula, ViewState } from './types';
import { cleanAndParseJSON, SYSTEM_PROMPT_TEMPLATE } from './services/geminiService';

// --- Types & Defaults ---

interface UiSettings {
    // --- ГЛОБАЛЬНАЯ ГЕОМЕТРИЯ (Global Geometry) ---
    headerHeight: number;
    footerHeight: number;
    maxWidth: number;
    
    // --- СПИСКИ И СЕТКИ (Lists & Grids) ---
    rowHeight: number;
    gridRowHeight: number;
    gridGap: number;
    listGap: number;
    
    // --- ИКОНКИ И ИНДИКАТОРЫ (Icons) ---
    iconSize: number;
    iconStrokeWidth: number;
    
    // --- СЛАЙДЕРЫ И ВВОД (Inputs) ---
    sliderThumbSize: number;
    sliderTrackHeight: number;
    sliderHeight: number;
    sliderGap: number;
    sliderPaddingX: number;
    sliderPaddingY: number;
    sliderButtonWidth: number;
    sliderButtonIconSize: number;
    sliderLabelFontSize: number;
    sliderValueFontSize: number;
    sliderUnitFontSize: number;
    sliderLineThickness: number;
    sliderBorderRadius: number;
    sliderTextPaddingTop: number;
    sliderTextPaddingBottom: number;
    inputHeight: number;
    searchBarHeight: number;
    
    // --- КЛАВИАТУРА И МОДАЛКИ (Overlays) ---
    keyboardHeight: number;
    keyboardKeyGap: number;
    modalMaxWidth: number;
    
    // --- ТИПОГРАФИКА: РАЗМЕРЫ (Font Sizes) ---
    headerFontSize: number; // H1
    subHeaderFontSize: number; // H2/H3
    bodyFontSize: number; // Regular text
    smallFontSize: number; // Meta/Labels
    inputFontSize: number; // Main Input fields
    resultFontSize: number; // Big Result display
    keyboardKeyFontSize: number;
    descriptionFontSize: number;
    labelFontSize: number;
    
    // --- ТИПОГРАФИКА: ИНТЕРВАЛЫ (Type Spacing) ---
    lineHeightBase: number; // Multiplier x100 (e.g. 150 = 1.5)
    lineHeightHeading: number;
    lineHeightDescription: number;
    letterSpacingHeader: number; // px
    letterSpacingBody: number; // px
    
    // --- ТИПОГРАФИКА: ЖИРНОСТЬ (Font Weights) ---
    weightHeader: number;
    weightBody: number;
    weightInput: number;
    
    // --- ОТСТУПЫ: ВНЕШНИЕ (Margins/Gaps) ---
    sectionGap: number;
    elementGapX: number;
    elementGapY: number;
    titleGap: number;
    labelGap: number;
    
    // --- ОТСТУПЫ: ВНУТРЕННИЕ (Paddings) ---
    screenPaddingX: number;
    screenPaddingY: number;
    cardPaddingX: number;
    cardPaddingY: number;
    inputPaddingX: number;
    inputPaddingY: number;
    buttonPaddingX: number;
    buttonPaddingY: number;
    
    // --- ОТСТУПЫ: НОВЫЕ (New Paddings/Sizes) ---
    headerPaddingX: number;
    headerPaddingY: number;
    searchBarPaddingX: number;
    searchBarPaddingY: number;
    tagPaddingX: number;
    tagPaddingY: number;
    tagFontSize: number;
    tagBorderRadius: number;
    resultBoxPaddingX: number;
    resultBoxPaddingY: number;
    keyboardPaddingX: number;
    keyboardPaddingY: number;
    keyboardKeyBorderRadius: number;
    modalPaddingX: number;
    modalPaddingY: number;
    buttonHeight: number;
    iconButtonSize: number;
    cardIconSize: number;
    variableRowPaddingX: number;
    variableRowPaddingY: number;
    variableRowGap: number;
    
    // --- ГРАНИЦЫ (Borders) ---
    borderRadiusSm: number;
    borderRadiusMd: number;
    borderRadiusLg: number;
    borderRadiusFull: number; // Usually high number for circles
    borderWidthGlobal: number;
    borderWidthInput: number;
    borderWidthActive: number;
    
    // --- ЭФФЕКТЫ (Effects) ---
    shadowIntensity: number;
    glassBlur: number;
    activeScale: number; // % scale on click (98 = 0.98)
    
    // --- ПРОЗРАЧНОСТЬ (Opacity) ---
    opacityHover: number;
    opacityActive: number;
    opacityDisabled: number;
    opacityPlaceholder: number;
    opacityBackdrop: number;
    opacityCardBg: number;
    
    // --- СИСТЕМА (System) ---
    animationSpeed: number;
    scrollbarWidth: number;
    
    // --- СПЕЦИФИЧЕСКИЕ (Specifics) ---
    resultBoxMinHeight: number;
    variableSymbolWidth: number;
}

const DEFAULT_UI_SETTINGS: UiSettings = {
    // Geometry
    headerHeight: 44,
    footerHeight: 44,
    maxWidth: 600,
    
    // Lists/Grids
    rowHeight: 48,
    gridRowHeight: 90,
    gridGap: 1,
    listGap: 1,
    
    // Icons
    iconSize: 18,
    iconStrokeWidth: 2,
    
    // Inputs
    sliderThumbSize: 16,
    sliderTrackHeight: 16,
    sliderHeight: 96,
    sliderGap: 12,
    sliderPaddingX: 8,
    sliderPaddingY: 8,
    sliderButtonWidth: 64,
    sliderButtonIconSize: 24,
    sliderLabelFontSize: 10,
    sliderValueFontSize: 30,
    sliderUnitFontSize: 10,
    sliderLineThickness: 4,
    sliderBorderRadius: 32,
    sliderTextPaddingTop: 12,
    sliderTextPaddingBottom: 12,
    inputHeight: 32,
    searchBarHeight: 36,
    
    // Overlays
    keyboardHeight: 240,
    keyboardKeyGap: 1,
    modalMaxWidth: 360,
    
    // Font Sizes
    headerFontSize: 14,
    subHeaderFontSize: 12,
    bodyFontSize: 11,
    smallFontSize: 10,
    inputFontSize: 20,
    resultFontSize: 36,
    keyboardKeyFontSize: 18,
    descriptionFontSize: 12,
    labelFontSize: 10,
    
    // Line Heights (x100)
    lineHeightBase: 140,
    lineHeightHeading: 110,
    lineHeightDescription: 140,
    letterSpacingHeader: 1,
    letterSpacingBody: 0,
    
    // Weights
    weightHeader: 700,
    weightBody: 400,
    weightInput: 600,
    
    // Gaps
    sectionGap: 12,
    elementGapX: 6,
    elementGapY: 6,
    titleGap: 4,
    labelGap: 4,
    
    // Paddings
    screenPaddingX: 12,
    screenPaddingY: 12,
    cardPaddingX: 12,
    cardPaddingY: 12,
    inputPaddingX: 6,
    inputPaddingY: 2,
    buttonPaddingX: 12,
    buttonPaddingY: 8,
    
    // New Paddings/Sizes
    headerPaddingX: 16,
    headerPaddingY: 0,
    searchBarPaddingX: 16,
    searchBarPaddingY: 8,
    tagPaddingX: 8,
    tagPaddingY: 4,
    tagFontSize: 10,
    tagBorderRadius: 4,
    resultBoxPaddingX: 24,
    resultBoxPaddingY: 24,
    keyboardPaddingX: 0,
    keyboardPaddingY: 0,
    keyboardKeyBorderRadius: 0,
    modalPaddingX: 24,
    modalPaddingY: 24,
    buttonHeight: 48,
    iconButtonSize: 40,
    cardIconSize: 24,
    variableRowPaddingX: 16,
    variableRowPaddingY: 8,
    variableRowGap: 8,
    
    // Borders
    borderRadiusSm: 2,
    borderRadiusMd: 4,
    borderRadiusLg: 8,
    borderRadiusFull: 999,
    borderWidthGlobal: 1,
    borderWidthInput: 1,
    borderWidthActive: 2,
    
    // Effects
    shadowIntensity: 10,
    glassBlur: 8,
    activeScale: 98,
    
    // Opacity
    opacityHover: 90,
    opacityActive: 70,
    opacityDisabled: 50,
    opacityPlaceholder: 40,
    opacityBackdrop: 95,
    opacityCardBg: 100, // % of theme color
    
    // System
    animationSpeed: 0, // Set to 0 for instant response
    scrollbarWidth: 4,
    
    // Specifics
    resultBoxMinHeight: 100,
    variableSymbolWidth: 40
};

const RUSSIAN_LABELS: Record<keyof UiSettings, string> = {
    headerHeight: "ВЫСОТА ШАПКИ",
    footerHeight: "ВЫСОТА ПОДВАЛА",
    maxWidth: "МАКС. ШИРИНА КОНТЕЙНЕРА",
    rowHeight: "ВЫСОТА СТРОКИ СПИСКА",
    gridRowHeight: "ВЫСОТА ЯЧЕЙКИ СЕТКИ",
    gridGap: "ОТСТУП СЕТКИ",
    listGap: "ОТСТУП СПИСКА",
    iconSize: "РАЗМЕР ИКОНОК",
    iconStrokeWidth: "ТОЛЩИНА ЛИНИЙ ИКОНОК",
    sliderThumbSize: "РАЗМЕР ПОЛЗУНКА",
    sliderTrackHeight: "ВЫСОТА ТРЕКА СЛАЙДЕРА",
    sliderHeight: "ВЫСОТА СЛАЙДЕРА",
    sliderGap: "ОТСТУП МЕЖДУ СЛАЙДЕРАМИ",
    sliderPaddingX: "ВНУТР. ОТСТУП СЛАЙДЕРА X",
    sliderPaddingY: "ВНУТР. ОТСТУП СЛАЙДЕРА Y",
    sliderButtonWidth: "ШИРИНА КНОПОК +/-",
    sliderButtonIconSize: "РАЗМЕР ИКОНОК +/-",
    sliderLabelFontSize: "РАЗМЕР ТЕКСТА НАЗВАНИЯ",
    sliderValueFontSize: "РАЗМЕР ТЕКСТА ЗНАЧЕНИЯ",
    sliderUnitFontSize: "РАЗМЕР ТЕКСТА ЕДИНИЦ",
    sliderLineThickness: "ТОЛЩИНА ЛИНИИ ИНДИКАТОРА",
    sliderBorderRadius: "РАДИУС СКРУГЛЕНИЯ СЛАЙДЕРА",
    sliderTextPaddingTop: "ОТСТУП ТЕКСТА СВЕРХУ",
    sliderTextPaddingBottom: "ОТСТУП ТЕКСТА СНИЗУ",
    inputHeight: "ВЫСОТА ПОЛЯ ВВОДА",
    searchBarHeight: "ВЫСОТА ПОИСКА",
    keyboardHeight: "ВЫСОТА КЛАВИАТУРЫ",
    keyboardKeyGap: "ЗАЗОР КЛАВИШ",
    modalMaxWidth: "ШИРИНА МОДАЛЬНОГО ОКНА",
    headerFontSize: "РАЗМЕР ЗАГОЛОВКОВ H1",
    subHeaderFontSize: "РАЗМЕР ПОДЗАГОЛОВКОВ",
    bodyFontSize: "РАЗМЕР ОСНОВНОГО ТЕКСТА",
    smallFontSize: "РАЗМЕР МЕЛКОГО ТЕКСТА",
    inputFontSize: "РАЗМЕР ШРИФТА ВВОДА",
    resultFontSize: "РАЗМЕР РЕЗУЛЬТАТА",
    keyboardKeyFontSize: "РАЗМЕР СИМВОЛОВ КЛАВИШ",
    descriptionFontSize: "РАЗМЕР ОПИСАНИЯ",
    labelFontSize: "РАЗМЕР МЕТОК",
    lineHeightBase: "МЕЖСТРОЧНЫЙ (ТЕКСТ)",
    lineHeightHeading: "МЕЖСТРОЧНЫЙ (ЗАГОЛОВКИ)",
    lineHeightDescription: "МЕЖСТРОЧНЫЙ (ОПИСАНИЯ)",
    letterSpacingHeader: "ТРЕКИНГ ЗАГОЛОВКОВ",
    letterSpacingBody: "ТРЕКИНГ ТЕКСТА",
    weightHeader: "ЖИРНОСТЬ ЗАГОЛОВКОВ",
    weightBody: "ЖИРНОСТЬ ТЕКСТА",
    weightInput: "ЖИРНОСТЬ ВВОДА",
    sectionGap: "ОТСТУП МЕЖДУ СЕКЦИЯМИ",
    elementGapX: "ГОРИЗ. ОТСТУП ЭЛЕМЕНТОВ",
    elementGapY: "ВЕРТ. ОТСТУП ЭЛЕМЕНТОВ",
    titleGap: "ОТСТУП ПОСЛЕ ЗАГОЛОВКА",
    labelGap: "ОТСТУП ПЕРЕД ПОЛЕМ",
    screenPaddingX: "ОТСТУП ЭКРАНА (БОКОВОЙ)",
    screenPaddingY: "ОТСТУП ЭКРАНА (ВЕРХ/НИЗ)",
    cardPaddingX: "ВНУТР. ОТСТУП КАРТОЧКИ X",
    cardPaddingY: "ВНУТР. ОТСТУП КАРТОЧКИ Y",
    inputPaddingX: "ВНУТР. ОТСТУП ВВОДА X",
    inputPaddingY: "ВНУТР. ОТСТУП ВВОДА Y",
    buttonPaddingX: "ВНУТР. ОТСТУП КНОПКИ X",
    buttonPaddingY: "ВНУТР. ОТСТУП КНОПКИ Y",
    headerPaddingX: "ОТСТУП ШАПКИ X",
    headerPaddingY: "ОТСТУП ШАПКИ Y",
    searchBarPaddingX: "ОТСТУП ПОИСКА X",
    searchBarPaddingY: "ОТСТУП ПОИСКА Y",
    tagPaddingX: "ОТСТУП ТЕГА X",
    tagPaddingY: "ОТСТУП ТЕГА Y",
    tagFontSize: "РАЗМЕР ШРИФТА ТЕГА",
    tagBorderRadius: "РАДИУС ТЕГА",
    resultBoxPaddingX: "ОТСТУП РЕЗУЛЬТАТА X",
    resultBoxPaddingY: "ОТСТУП РЕЗУЛЬТАТА Y",
    keyboardPaddingX: "ОТСТУП КЛАВИАТУРЫ X",
    keyboardPaddingY: "ОТСТУП КЛАВИАТУРЫ Y",
    keyboardKeyBorderRadius: "РАДИУС КЛАВИШИ",
    modalPaddingX: "ОТСТУП МОДАЛКИ X",
    modalPaddingY: "ОТСТУП МОДАЛКИ Y",
    buttonHeight: "ВЫСОТА КНОПКИ",
    iconButtonSize: "РАЗМЕР КНОПКИ-ИКОНКИ",
    cardIconSize: "РАЗМЕР ИКОНКИ КАРТОЧКИ",
    variableRowPaddingX: "ОТСТУП СТРОКИ ПЕРЕМЕННОЙ X",
    variableRowPaddingY: "ОТСТУП СТРОКИ ПЕРЕМЕННОЙ Y",
    variableRowGap: "РАССТОЯНИЕ МЕЖДУ ПЕРЕМЕННЫМИ",
    borderRadiusSm: "РАДИУС МАЛЫЙ",
    borderRadiusMd: "РАДИУС СРЕДНИЙ",
    borderRadiusLg: "РАДИУС БОЛЬШОЙ",
    borderRadiusFull: "РАДИУС ПОЛНЫЙ (КРУГ)",
    borderWidthGlobal: "ТОЛЩИНА ГРАНИЦ ОБЩАЯ",
    borderWidthInput: "ТОЛЩИНА ГРАНИЦ ВВОДА",
    borderWidthActive: "ТОЛЩИНА АКТИВНОЙ ГРАНИЦЫ",
    shadowIntensity: "СИЛА ТЕНИ",
    glassBlur: "СИЛА РАЗМЫТИЯ (BLUR)",
    activeScale: "МАСШТАБ ПРИ НАЖАТИИ (%)",
    opacityHover: "ПРОЗРАЧНОСТЬ ПРИ НАВЕДЕНИИ",
    opacityActive: "ПРОЗРАЧНОСТЬ ПРИ НАЖАТИИ",
    opacityDisabled: "ПРОЗРАЧНОСТЬ НЕАКТИВНОГО",
    opacityPlaceholder: "ПРОЗРАЧНОСТЬ ПОДСКАЗКИ",
    opacityBackdrop: "ЗАТЕМНЕНИЕ ФОНА (МОДАЛКИ)",
    opacityCardBg: "НЕПРОЗРАЧНОСТЬ КАРТОЧЕК",
    animationSpeed: "СКОРОСТЬ АНИМАЦИИ (мс)",
    scrollbarWidth: "ШИРИНА ПОЛОСЫ ПРОКРУТКИ",
    resultBoxMinHeight: "МИН. ВЫСОТА РЕЗУЛЬТАТА",
    variableSymbolWidth: "ШИРИНА КОЛОНКИ СИМВОЛА"
};

const PARAMETER_DESCRIPTIONS: Record<keyof UiSettings, string> = {
    headerHeight: "Управляет вертикальным размером верхней навигационной панели, где находятся заголовок и основные кнопки управления. Изменение этого параметра позволяет сделать шапку более компактной для маленьких экранов или более просторной для удобства нажатия. Значение напрямую влияет на layout приложения.",
    footerHeight: "Задает высоту нижней закрепленной панели, содержащей ключевые действия (редактирование, настройки, назад). Увеличение высоты полезно для пользователей с крупными пальцами, уменьшение — освобождает место для контента. Этот параметр фиксирует панель внизу экрана.",
    maxWidth: "Ограничивает максимальную ширину центрального контейнера приложения на десктопных экранах, предотвращая растягивание интерфейса. Это создает эффект 'мобильного приложения' на мониторе. Значение задается в пикселях.",
    rowHeight: "Определяет минимальную высоту одной строки в списке формул на главном экране. Влияет на плотность информации: меньшее значение позволяет увидеть больше элементов, большее — упрощает попадание по ним. Работает только в режиме списка.",
    gridRowHeight: "Контролирует высоту карточек формул при переключении в режим сетки (Grid View). Это позволяет сбалансировать отображение заголовка и формулы внутри квадратных или прямоугольных блоков. Подбирайте под длину ваших названий.",
    gridGap: "Устанавливает расстояние (зазор) между карточками в режиме сетки. Полезно для визуального разделения элементов друг от друга. Значение в 1px создает эффект тонких разделительных линий.",
    listGap: "Задает вертикальный отступ между строками в режиме списка. Увеличение этого параметра добавляет 'воздух' между элементами, делая список менее загруженным. При значении 1px выглядит как разделитель.",
    iconSize: "Глобальный размер всех иконок в интерфейсе (ширина и высота в пикселях). Изменение этого параметра масштабирует иконки действий, навигации и статусов. Важно для доступности и эстетики.",
    iconStrokeWidth: "Регулирует толщину линий внутри векторных иконок. Тонкие линии (1px) выглядят элегантно и современно, толстые (2-3px) улучшают читаемость на ярком солнце или при плохом зрении. Влияет на 'вес' интерфейса.",
    sliderThumbSize: "Диаметр круглого ползунка, за который пользователь тянет при изменении значений переменных. Крупный ползунок удобнее для сенсорного управления, мелкий — точнее выглядит. Это ключевой элемент интерактивности.",
    sliderTrackHeight: "Высота невидимой сенсорной зоны вокруг линии слайдера. Увеличение этого значения позволяет пользователю легче 'схватить' слайдер, не требуя пиксельной точности нажатия. Визуальная линия остается тонкой.",
    sliderHeight: "Высота контейнера слайдера.",
    sliderGap: "Расстояние между слайдерами.",
    sliderPaddingX: "Горизонтальный внутренний отступ слайдера.",
    sliderPaddingY: "Вертикальный внутренний отступ слайдера.",
    sliderButtonWidth: "Ширина кнопок плюс и минус по краям слайдера.",
    sliderButtonIconSize: "Размер иконок внутри кнопок плюс и минус.",
    sliderLabelFontSize: "Размер шрифта для названия переменной в слайдере.",
    sliderValueFontSize: "Размер шрифта для значения переменной в слайдере.",
    sliderUnitFontSize: "Размер шрифта для единиц измерения в слайдере.",
    sliderLineThickness: "Толщина вертикальной линии-индикатора заполнения слайдера.",
    sliderBorderRadius: "Радиус скругления углов контейнера слайдера.",
    sliderTextPaddingTop: "Отступ от верхнего края для текста внутри слайдера.",
    sliderTextPaddingBottom: "Отступ от нижнего края для текста внутри слайдера.",
    inputHeight: "Стандартная высота текстовых полей ввода данных. Влияет на размер области клика и вертикальное выравнивание текста внутри поля. Оптимизируйте под размер пальца.",
    searchBarHeight: "Высота поля поиска на главном экране. Сделайте его больше для акцента на поиске или меньше для экономии места. Влияет на общую компоновку верхней части списка.",
    keyboardHeight: "Общая высота области виртуальной цифровой клавиатуры. Уменьшение высоты оставляет больше места для просмотра контента, увеличение делает клавиши крупнее и удобнее. Критично для маленьких экранов.",
    keyboardKeyGap: "Размер промежутков между кнопками виртуальной клавиатуры. Большие зазоры помогают избежать случайных нажатий соседних клавиш. При значении 1px создается эффект сетки.",
    modalMaxWidth: "Ограничивает ширину всплывающих окон (настройки, AI, импорт) на больших экранах. Позволяет сохранять читаемую длину строки текста. На мобильных устройствах окна обычно занимают всю ширину.",
    headerFontSize: "Размер шрифта для основного заголовка приложения и названий инструментов. Крупный шрифт улучшает иерархию, мелкий — выглядит строже. Значение в пикселях.",
    subHeaderFontSize: "Размер шрифта для второстепенных заголовков групп и секций. Должен быть меньше основного заголовка, но больше основного текста. Помогает структурировать информацию.",
    bodyFontSize: "Базовый размер шрифта для большинства текстовых элементов и меток. Это основной параметр читаемости интерфейса. Подбирайте так, чтобы текст был разборчив без напряжения глаз.",
    smallFontSize: "Размер самого мелкого текста, используемого для подписей, единиц измерения и мета-данных. Не делайте его слишком мелким, чтобы сохранить доступность. Обычно составляет 70-80% от основного.",
    inputFontSize: "Размер цифр внутри полей ввода значений. Крупные цифры облегчают чтение введенных данных и проверку расчетов. Это фокусная точка для пользователя.",
    resultFontSize: "Размер шрифта для отображения итогового результата вычислений. Должен быть самым крупным элементом на экране раннера, чтобы результат считывался мгновенно. Акцентирует внимание на цели.",
    keyboardKeyFontSize: "Размер цифр и символов на кнопках виртуальной клавиатуры. Должен быть достаточно крупным для быстрой визуальной идентификации клавиш. Влияет на комфорт набора.",
    descriptionFontSize: "Размер шрифта для описаний и подсказок.",
    labelFontSize: "Размер шрифта для меток полей ввода.",
    lineHeightBase: "Множитель межстрочного интервала для обычного текста (150 = 1.5 строки). Хороший интервал улучшает читаемость блоков текста, предотвращая слияние строк. Важно для описаний.",
    lineHeightHeading: "Множитель межстрочного интервала для заголовков. Заголовки обычно требуют более плотного интервала (110-120), чтобы выглядеть цельно. Влияет на компактность шапки.",
    lineHeightDescription: "Межстрочный интервал для многострочных описаний.",
    letterSpacingHeader: "Дополнительное расстояние между буквами в заголовках (трекинг). Увеличенный трекинг придает надписям современный и премиальный вид. Значение в пикселях.",
    letterSpacingBody: "Расстояние между буквами в основном тексте. Обычно равно 0 или небольшому значению. Слишком большой трекинг ухудшает читаемость длинных текстов.",
    weightHeader: "Насыщенность (толщина) шрифта заголовков (400=обычный, 700=жирный). Жирные заголовки создают сильный контраст и иерархию. Влияет на визуальный 'голос' приложения.",
    weightBody: "Насыщенность основного текста. Для темных тем часто используют чуть более легкие начертания. Влияет на общую легкость восприятия интерфейса.",
    weightInput: "Насыщенность шрифта вводимых данных. Жирный шрифт делает значения более заметными на фоне меток. Помогает выделить пользовательский ввод.",
    sectionGap: "Вертикальное расстояние между крупными логическими блоками интерфейса. Большие отступы помогают разделить контент и дают глазу отдохнуть. Влияет на длину прокрутки.",
    elementGapX: "Стандартное горизонтальное расстояние между соседними элементами (например, иконкой и текстом). Обеспечивает ритм и аккуратность верстки. Слишком малое значение склеивает элементы.",
    elementGapY: "Стандартное вертикальное расстояние между элементами в стопке. Используется в списках и формах. Определяет плотность информации по вертикали.",
    titleGap: "Расстояние между заголовком и описанием.",
    labelGap: "Расстояние между меткой и полем ввода.",
    screenPaddingX: "Боковые отступы всего контента от краев экрана. Предотвращает прилипание текста к рамкам устройства. Важно для эстетики и удобства свайпов.",
    screenPaddingY: "Вертикальные отступы контента от верха и низа (внутри прокручиваемой области). Гарантирует, что контент не перекрывается системными элементами. Создает безопасную зону.",
    cardPaddingX: "Внутренние боковые отступы в карточках и блоках. Определяет, насколько контент отстоит от границ карточки. Влияет на восприятие 'воздуха' внутри элементов.",
    cardPaddingY: "Внутренние вертикальные отступы в карточках. Балансирует высоту карточки относительно её содержимого. Важно для кликабельных областей.",
    inputPaddingX: "Горизонтальный отступ текста внутри поля ввода. Не дает тексту прилипать к границам поля. Влияет на визуальную чистоту форм.",
    inputPaddingY: "Вертикальный отступ текста внутри поля ввода. Центрирует текст по вертикали. Важен для комфортного восприятия вводимых данных.",
    buttonPaddingX: "Боковые отступы внутри кнопок. Определяет ширину кнопки относительно текста. Более широкие кнопки выглядят солиднее и по ним легче попасть.",
    buttonPaddingY: "Вертикальные отступы внутри кнопок. Определяет высоту кнопки. Влияет на общую массивность интерактивных элементов.",
    headerPaddingX: "Горизонтальный отступ внутри шапки приложения.",
    headerPaddingY: "Вертикальный отступ внутри шапки приложения.",
    searchBarPaddingX: "Горизонтальный отступ внутри строки поиска.",
    searchBarPaddingY: "Вертикальный отступ внутри строки поиска.",
    tagPaddingX: "Горизонтальный отступ внутри тегов.",
    tagPaddingY: "Вертикальный отступ внутри тегов.",
    tagFontSize: "Размер шрифта текста внутри тегов.",
    tagBorderRadius: "Радиус скругления углов тегов.",
    resultBoxPaddingX: "Горизонтальный отступ внутри блока с результатом вычисления.",
    resultBoxPaddingY: "Вертикальный отступ внутри блока с результатом вычисления.",
    keyboardPaddingX: "Горизонтальный отступ вокруг клавиатуры.",
    keyboardPaddingY: "Вертикальный отступ вокруг клавиатуры.",
    keyboardKeyBorderRadius: "Радиус скругления кнопок клавиатуры.",
    modalPaddingX: "Горизонтальный отступ внутри модальных окон.",
    modalPaddingY: "Вертикальный отступ внутри модальных окон.",
    buttonHeight: "Фиксированная высота основных кнопок.",
    iconButtonSize: "Размер квадратных кнопок с иконками (например, в шапке).",
    cardIconSize: "Размер иконки внутри карточки формулы.",
    variableRowPaddingX: "Горизонтальный отступ внутри строки переменной в редакторе.",
    variableRowPaddingY: "Вертикальный отступ внутри строки переменной в редакторе.",
    variableRowGap: "Расстояние между строками переменных в редакторе.",
    borderRadiusSm: "Радиус скругления углов для мелких элементов (теги, бэйджи). Легкое скругление делает интерфейс дружелюбнее, отсутствие скругления — строже. Значение в пикселях.",
    borderRadiusMd: "Радиус скругления для средних элементов (поля ввода, карточки). Основной параметр, определяющий стиль (soft vs sharp) всего приложения. Должен быть согласован.",
    borderRadiusLg: "Радиус скругления для крупных блоков и модальных окон. Сильное скругление создает ощущение 'карточки' или 'листа'. Влияет на силуэт окон.",
    borderRadiusFull: "Значение для создания полностью круглых элементов (кнопок-иконок, аватаров). Обычно ставится большое число (999). Делает элементы максимально мягкими.",
    borderWidthGlobal: "Базовая толщина всех разделительных линий и рамок в приложении. Тонкие линии (1px) выглядят легко, толстые — добавляют графичности и брутальности. Влияет на сетку.",
    borderWidthInput: "Толщина рамки у полей ввода и активных элементов. Может быть толще глобальных границ для акцента. Четкие границы помогают понять границы ввода.",
    borderWidthActive: "Толщина рамки при фокусе или активном состоянии элемента. Увеличение толщины дает ясную обратную связь пользователю о текущем действии. Улучшает доступность.",
    shadowIntensity: "Глобальная интенсивность теней (прозрачность черного цвета тени). Высокое значение добавляет глубину и объем, низкое или 0 делает интерфейс плоским (Flat). Влияет на 'слоистость'.",
    glassBlur: "Сила размытия фона (backdrop-filter) под прозрачными элементами, такими как модальные окна. Создает эффект матового стекла. Высокое значение улучшает читаемость текста поверх фона.",
    activeScale: "Коэффициент масштабирования элемента при нажатии (в процентах). Значение 98 означает уменьшение до 98%. Создает тактильное ощущение нажатия физической кнопки.",
    opacityHover: "Прозрачность интерактивного элемента при наведении курсора мыши. Дает визуальную подсказку о возможности взаимодействия. Обычно около 80-90%.",
    opacityActive: "Прозрачность элемента в момент нажатия. Дополнительная обратная связь помимо масштабирования. Делает интерфейс отзывчивым.",
    opacityDisabled: "Прозрачность недоступных (заблокированных) элементов. Должна быть достаточно низкой, чтобы элемент выглядел неактивным, но читаемым. Около 50%.",
    opacityPlaceholder: "Прозрачность текста-подсказки (placeholder) в полях ввода. Должен быть менее контрастным, чем введенный текст. Влияет на чистоту формы.",
    opacityBackdrop: "Степень затемнения фона за модальными окнами. Высокое затемнение фокусирует внимание на окне, низкое сохраняет контекст заднего плана. Влияет на контраст.",
    opacityCardBg: "НЕПРОЗРАЧНОСТЬ КАРТОЧЕК",
    animationSpeed: "СКОРОСТЬ АНИМАЦИИ (мс)",
    scrollbarWidth: "ШИРИНА ПОЛОСЫ ПРОКРУТКИ",
    resultBoxMinHeight: "МИН. ВЫСОТА РЕЗУЛЬТАТА",
    variableSymbolWidth: "ШИРИНА КОЛОНКИ СИМВОЛА"
};

// Default scaled to 0-100 range (approx slate-950)
const DEFAULT_RGB = { r: 6, g: 9, b: 16 }; 

// --- Helper Components ---

const RgbSlider = ({ label, value, onChange, colorClass }: any) => (
    <div className="flex items-center gap-3 mb-2">
        <span className={`w-4 font-bold text-[10px] uppercase ${colorClass}`}>{label}</span>
        <input 
            type="range" 
            min="0" 
            max="100" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-custom-900 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <span className="w-8 text-right font-mono text-[10px] text-white">{value}%</span>
    </div>
);

// --- Theme Generator ---

const generateThemeCss = (r: number, g: number, b: number, settings: UiSettings) => {
    // Scale 0-100 inputs to 0-255
    const r255 = Math.round((r / 100) * 255);
    const g255 = Math.round((g / 100) * 255);
    const b255 = Math.round((b / 100) * 255);

    // Helper to mix color with white/black to generate shades
    const mix = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, weight: number) => {
        const w = weight / 100;
        return [
            Math.round(r1 * (1 - w) + r2 * w),
            Math.round(g1 * (1 - w) + g2 * w),
            Math.round(b1 * (1 - w) + b2 * w)
        ];
    };

    const shades: Record<number, number[]> = {};
    
    shades[950] = [r255, g255, b255];
    shades[900] = mix(r255, g255, b255, 255, 255, 255, 5);
    shades[800] = mix(r255, g255, b255, 255, 255, 255, 15);
    shades[700] = mix(r255, g255, b255, 255, 255, 255, 30);
    shades[600] = mix(r255, g255, b255, 255, 255, 255, 45);
    shades[500] = mix(r255, g255, b255, 255, 255, 255, 60);
    shades[400] = mix(r255, g255, b255, 255, 255, 255, 70);
    shades[300] = mix(r255, g255, b255, 255, 255, 255, 80);
    
    // Inject CSS variables for deep customisation
    let css = `
        :root {
            --thumb-size: ${settings.sliderThumbSize}px;
            --track-height: ${settings.sliderTrackHeight}px;
            --scrollbar-width: ${settings.scrollbarWidth}px;
            --glass-blur: ${settings.glassBlur}px;
            
            --slider-height: ${settings.sliderHeight}px;
            --slider-gap: ${settings.sliderGap}px;
            --slider-padding-x: ${settings.sliderPaddingX}px;
            --slider-padding-y: ${settings.sliderPaddingY}px;
            --slider-button-width: ${settings.sliderButtonWidth}px;
            --slider-button-icon-size: ${settings.sliderButtonIconSize}px;
            --slider-label-font-size: ${settings.sliderLabelFontSize}px;
            --slider-value-font-size: ${settings.sliderValueFontSize}px;
            --slider-unit-font-size: ${settings.sliderUnitFontSize}px;
            --slider-line-thickness: ${settings.sliderLineThickness}px;
            --slider-border-radius: ${settings.sliderBorderRadius}px;
            --slider-text-padding-top: ${settings.sliderTextPaddingTop}px;
            --slider-text-padding-bottom: ${settings.sliderTextPaddingBottom}px;
            
            --description-font-size: ${settings.descriptionFontSize}px;
            --label-font-size: ${settings.labelFontSize}px;
            --line-height-description: ${settings.lineHeightDescription / 100};
            --title-gap: ${settings.titleGap}px;
            --label-gap: ${settings.labelGap}px;
            
            --line-height-base: ${settings.lineHeightBase / 100};
            --line-height-heading: ${settings.lineHeightHeading / 100};
            
            --border-width-global: ${settings.borderWidthGlobal}px;
            --border-width-input: ${settings.borderWidthInput}px;
            --border-width-active: ${settings.borderWidthActive}px;
            
            --radius-sm: ${settings.borderRadiusSm}px;
            --radius-md: ${settings.borderRadiusMd}px;
            --radius-lg: ${settings.borderRadiusLg}px;
            --radius-full: ${settings.borderRadiusFull}px;
            
            --opacity-hover: ${settings.opacityHover / 100};
            --opacity-active: ${settings.opacityActive / 100};
            --active-scale: ${settings.activeScale / 100};
            
            --header-padding-x: ${settings.headerPaddingX}px;
            --header-padding-y: ${settings.headerPaddingY}px;
            --search-bar-padding-x: ${settings.searchBarPaddingX}px;
            --search-bar-padding-y: ${settings.searchBarPaddingY}px;
            --tag-padding-x: ${settings.tagPaddingX}px;
            --tag-padding-y: ${settings.tagPaddingY}px;
            --tag-font-size: ${settings.tagFontSize}px;
            --tag-border-radius: ${settings.tagBorderRadius}px;
            --result-box-padding-x: ${settings.resultBoxPaddingX}px;
            --result-box-padding-y: ${settings.resultBoxPaddingY}px;
            --keyboard-padding-x: ${settings.keyboardPaddingX}px;
            --keyboard-padding-y: ${settings.keyboardPaddingY}px;
            --keyboard-key-border-radius: ${settings.keyboardKeyBorderRadius}px;
            --modal-padding-x: ${settings.modalPaddingX}px;
            --modal-padding-y: ${settings.modalPaddingY}px;
            --button-height: ${settings.buttonHeight}px;
            --icon-button-size: ${settings.iconButtonSize}px;
            --card-icon-size: ${settings.cardIconSize}px;
            --variable-row-padding-x: ${settings.variableRowPaddingX}px;
            --variable-row-padding-y: ${settings.variableRowPaddingY}px;
            --variable-row-gap: ${settings.variableRowGap}px;
            
            --section-gap: ${settings.sectionGap}px;
            --element-gap-x: ${settings.elementGapX}px;
            --element-gap-y: ${settings.elementGapY}px;
            
            --icon-stroke: ${settings.iconStrokeWidth}px;
        }
        
        body {
            line-height: var(--line-height-base);
        }
        
        ::-webkit-scrollbar {
            width: var(--scrollbar-width);
        }
        
        .backdrop-blur-md {
            backdrop-filter: blur(var(--glass-blur));
        }
        
        button:active {
            transform: scale(var(--active-scale));
        }
        
        .lucide {
            stroke-width: var(--icon-stroke);
        }
    `;
    
    Object.entries(shades).forEach(([step, [rr, gg, bb]]) => {
        css += `.bg-custom-${step} { background-color: rgb(${rr}, ${gg}, ${bb}); }\n`;
        css += `.hover\\:bg-custom-${step}:hover { background-color: rgb(${rr}, ${gg}, ${bb}); }\n`;
        css += `.active\\:bg-custom-${step}:active { background-color: rgb(${rr}, ${gg}, ${bb}); }\n`;
        css += `.text-custom-${step} { color: rgb(${rr}, ${gg}, ${bb}); }\n`;
        css += `.hover\\:text-custom-${step}:hover { color: rgb(${rr}, ${gg}, ${bb}); }\n`;
        css += `.border-custom-${step} { border-color: rgb(${rr}, ${gg}, ${bb}); }\n`;
        css += `.divide-custom-${step} > :not([hidden]) ~ :not([hidden]) { border-color: rgb(${rr}, ${gg}, ${bb}); }\n`;
        css += `.placeholder-custom-${step}::placeholder { color: rgb(${rr}, ${gg}, ${bb}); }\n`;
    });
    
    const [br, bg, bb] = shades[900];
    css += `.bg-custom-900\\/50 { background-color: rgba(${br}, ${bg}, ${bb}, 0.5); }\n`;
    css += `.bg-custom-900\\/30 { background-color: rgba(${br}, ${bg}, ${bb}, 0.3); }\n`;
    css += `.bg-black\\/95 { background-color: rgba(0, 0, 0, ${settings.opacityBackdrop / 100}); }\n`;
    
    // Card BG opacity
    const [cr, cg, cb] = shades[950];
    css += `.bg-card-base { background-color: rgba(${cr}, ${cg}, ${cb}, ${settings.opacityCardBg / 100}); }\n`;
    
    return css;
};

// --- Settings Modal ---

interface HelpModalProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  rgb: { r: number, g: number, b: number };
  setRgb: (rgb: { r: number, g: number, b: number }) => void;
  
  settings: UiSettings;
  updateSetting: (key: keyof UiSettings, val: number) => void;
  onReset: () => void;
  
  uiConfig: any;
}

const HelpModal = ({ 
    onClose, onExport, onImport, 
    rgb, setRgb,
    settings, updateSetting, onReset,
    uiConfig
}: HelpModalProps) => {

    return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center backdrop-blur-md animate-fade-in font-sans" style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}>
        <div 
            className={`bg-custom-950 w-full flex flex-col shadow-2xl relative border border-custom-900`}
            style={{ maxWidth: `${settings.modalMaxWidth}px`, borderRadius: `${settings.borderRadiusLg}px` }}
        >
            {/* Header */}
            <div className={`flex justify-between items-center px-6 border-b border-custom-900 shrink-0 ${uiConfig.headerHeightClass}`}>
                <h2 className={`${uiConfig.headerClassName} font-bold text-white font-mono tracking-widest`}>SYSTEM_CONFIG</h2>
                <button onClick={onClose} className={`text-custom-500 hover:text-white`}><X className={uiConfig.iconClassName}/></button>
            </div>
            
            <div className={`space-y-8 overflow-y-auto flex-1`} style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}>
                
                {/* RGB Theme Engine */}
                <div>
                    <label className={`${uiConfig.bodyClassName} font-bold text-custom-600 uppercase tracking-widest mb-4 block`}>ЦВЕТОВАЯ МАТРИЦА (0-100%)</label>
                    <div className="bg-custom-900/30 border border-custom-900" style={{ borderRadius: `${settings.borderRadiusMd}px`, paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}>
                        <RgbSlider label="R" value={rgb.r} onChange={(v: number) => setRgb({...rgb, r: v})} colorClass="text-red-500" />
                        <RgbSlider label="G" value={rgb.g} onChange={(v: number) => setRgb({...rgb, g: v})} colorClass="text-green-500" />
                        <RgbSlider label="B" value={rgb.b} onChange={(v: number) => setRgb({...rgb, b: v})} colorClass="text-blue-500" />
                        
                        <div className="mt-4 flex gap-2">
                             <div className="h-6 flex-1 bg-custom-950 border border-custom-800" title="950"></div>
                             <div className="h-6 flex-1 bg-custom-900 border border-custom-800" title="900"></div>
                             <div className="h-6 flex-1 bg-custom-800 border border-custom-800" title="800"></div>
                             <div className="h-6 flex-1 bg-custom-600 border border-custom-800" title="600"></div>
                             <div className="h-6 flex-1 bg-custom-500 border border-custom-800" title="500"></div>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div>
                    <label className={`${uiConfig.bodyClassName} font-bold text-custom-600 uppercase tracking-widest mb-4 block`}>СОХРАНЕНИЕ ДАННЫХ</label>
                    <div className="grid grid-cols-2 gap-px bg-custom-900 border border-custom-900" style={{ borderRadius: `${settings.borderRadiusMd}px`, overflow: 'hidden' }}>
                        <button 
                            onClick={onExport} 
                            className={`flex items-center justify-center gap-2 bg-custom-950 hover:bg-custom-900 text-blue-400 font-bold py-4 transition-colors ${uiConfig.bodyClassName} uppercase tracking-wide`}
                        >
                            <Download className={uiConfig.iconClassName} /> ЭКСПОРТ
                        </button>
                        <label className={`flex items-center justify-center gap-2 bg-custom-950 hover:bg-custom-900 text-emerald-400 font-bold py-4 transition-colors ${uiConfig.bodyClassName} uppercase tracking-wide cursor-pointer`}>
                            <Upload className={uiConfig.iconClassName} /> ИМПОРТ
                            <input type="file" onChange={onImport} className="hidden" accept=".json"/>
                        </label>
                    </div>
                </div>

                {/* Reset */}
                <div className="pt-4 border-t border-custom-900">
                    <button 
                        onClick={onReset}
                        className={`w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/30 py-3 transition-colors ${uiConfig.bodyClassName} font-bold uppercase tracking-widest`}
                        style={{ borderRadius: `${settings.borderRadiusMd}px` }}
                    >
                        <RotateCcw className={uiConfig.iconClassName} /> СБРОСИТЬ НАСТРОЙКИ
                    </button>
                </div>
            </div>
        </div>
    </div>
    );
};

// DevTool Widget Component
interface DevToolWidgetProps {
    onClose: () => void;
    settings: UiSettings;
    updateSetting: (key: keyof UiSettings, val: number) => void;
    onReset: () => void;
    uiConfig: any;
    initialCategory?: string | null;
}

const GLOBAL_KEYS: (keyof UiSettings)[] = [
    'headerHeight', 'footerHeight', 'maxWidth', 'iconSize', 'iconStrokeWidth',
    'headerFontSize', 'subHeaderFontSize', 'bodyFontSize', 'smallFontSize', 'descriptionFontSize', 'labelFontSize',
    'lineHeightBase', 'lineHeightHeading', 'lineHeightDescription', 'letterSpacingHeader', 'letterSpacingBody',
    'weightHeader', 'weightBody', 'sectionGap', 'elementGapX', 'elementGapY', 'titleGap', 'labelGap',
    'screenPaddingX', 'screenPaddingY', 'borderRadiusSm', 'borderRadiusMd', 'borderRadiusLg', 'borderRadiusFull',
    'borderWidthGlobal', 'shadowIntensity', 'activeScale', 'opacityHover', 'opacityActive', 'opacityDisabled',
    'animationSpeed', 'scrollbarWidth', 'headerPaddingX', 'headerPaddingY', 'iconButtonSize', 'buttonHeight'
];

const SETTING_CATEGORIES: Record<string, { label: string, keys: (keyof UiSettings)[] }> = {
    GLOBAL: {
        label: "ГЛОБАЛЬНЫЕ (GLOBAL)",
        keys: GLOBAL_KEYS
    },
    DASHBOARD: {
        label: "ГЛАВНЫЙ ЭКРАН (DASHBOARD)",
        keys: [
            'rowHeight', 'gridRowHeight', 'gridGap', 'listGap', 'searchBarHeight', 'searchBarPaddingX', 'searchBarPaddingY', 'opacityCardBg', 'cardIconSize', 'tagPaddingX', 'tagPaddingY', 'tagFontSize', 'tagBorderRadius',
            ...GLOBAL_KEYS
        ]
    },
    RUNNER: {
        label: "ЭКРАН ВЫЧИСЛЕНИЙ (RUNNER)",
        keys: [
            'sliderHeight', 'sliderGap', 'sliderPaddingX', 'sliderPaddingY', 'sliderButtonWidth', 'sliderButtonIconSize', 'sliderLabelFontSize', 'sliderValueFontSize', 'sliderUnitFontSize', 'sliderLineThickness', 'sliderBorderRadius', 'sliderTextPaddingTop', 'sliderTextPaddingBottom',
            'sliderThumbSize', 'sliderTrackHeight', 'inputHeight', 'inputFontSize', 'resultFontSize', 'resultBoxPaddingX', 'resultBoxPaddingY',
            'weightInput', 'inputPaddingX', 'inputPaddingY', 'borderWidthInput', 'borderWidthActive',
            'opacityPlaceholder', 'resultBoxMinHeight', 'variableSymbolWidth', 'keyboardHeight', 'keyboardKeyGap', 'keyboardKeyFontSize', 'keyboardPaddingX', 'keyboardPaddingY', 'keyboardKeyBorderRadius',
            ...GLOBAL_KEYS
        ]
    },
    EDITOR: {
        label: "РЕДАКТОР (EDITOR)",
        keys: [
            'buttonPaddingX', 'buttonPaddingY',
            'inputHeight', 'inputFontSize', 'weightInput', 'inputPaddingX', 'inputPaddingY', 'borderWidthInput', 'borderWidthActive', 'opacityPlaceholder',
            'variableRowPaddingX', 'variableRowPaddingY', 'variableRowGap',
            ...GLOBAL_KEYS
        ]
    },
    MODALS: {
        label: "ВСПЛЫВАЮЩИЕ ОКНА (MODALS)",
        keys: [
            'modalMaxWidth', 'modalPaddingX', 'modalPaddingY', 'glassBlur', 'opacityBackdrop',
            'buttonPaddingX', 'buttonPaddingY',
            ...GLOBAL_KEYS
        ]
    }
};

const DevToolWidget = ({ onClose, settings, updateSetting, onReset, uiConfig, initialCategory }: DevToolWidgetProps) => {
    const categories = Object.keys(SETTING_CATEGORIES);
    const [currentCategory, setCurrentCategory] = useState<string>(initialCategory && categories.includes(initialCategory) ? initialCategory : categories[0]);
    
    const currentKeys = SETTING_CATEGORIES[currentCategory].keys;
    const [currentKeyIndex, setCurrentKeyIndex] = useState<number>(0);
    
    const [showDesc, setShowDesc] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const longPressTriggered = useRef(false);
    
    // Ensure index is valid when category changes
    useEffect(() => {
        setCurrentKeyIndex(0);
    }, [currentCategory]);

    const currentKey = currentKeys[currentKeyIndex];
    
    const handlePrevKey = () => {
        setCurrentKeyIndex((prev) => (prev > 0 ? prev - 1 : currentKeys.length - 1));
    };

    const handleNextKey = () => {
        setCurrentKeyIndex((prev) => (prev < currentKeys.length - 1 ? prev + 1 : 0));
    };

    const getSettingRange = (key: keyof UiSettings) => {
        if (key.includes('FontSize')) return { min: 8, max: 100 };
        if (key.includes('Padding') || key.includes('Gap')) return { min: 0, max: 100 };
        if (key.includes('Height') || key.includes('Width') || key.includes('Size')) {
            if (key === 'maxWidth') return { min: 300, max: 2000 };
            return { min: 0, max: 500 };
        }
        if (key.includes('Thickness') || key.includes('StrokeWidth')) return { min: 0, max: 20 };
        if (key.includes('Radius')) {
            if (key === 'borderRadiusFull') return { min: 0, max: 999 };
            return { min: 0, max: 100 };
        }
        if (key.includes('opacity') || key.includes('Intensity') || key.includes('activeScale')) return { min: 0, max: 100 };
        if (key.includes('Weight')) return { min: 100, max: 900 };
        if (key.includes('lineHeight')) return { min: 50, max: 300 };
        if (key.includes('letterSpacing')) return { min: -20, max: 100 };
        if (key.includes('animation')) return { min: 0, max: 1000 };
        return { min: 0, max: 100 };
    };

    const handleValuePointerDown = () => {
        if (isEditing) return;
        longPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true;
            setIsEditing(true);
        }, 500);
    };

    const handleValuePointerUp = () => {
        if (isEditing) return;
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (!longPressTriggered.current) {
            updateSetting(currentKey, DEFAULT_UI_SETTINGS[currentKey]);
        }
    };

    const handleValuePointerLeave = () => {
        if (isEditing) return;
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const range = getSettingRange(currentKey);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-custom-950 border-t border-custom-900 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-fade-in">
             {showDesc && (
                 <div className="absolute bottom-full left-0 right-0 bg-custom-900 border-t border-custom-800 shadow-lg z-10" style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}>
                     <p className="text-custom-300 text-sm leading-relaxed max-w-xl mx-auto">
                         {PARAMETER_DESCRIPTIONS[currentKey]}
                     </p>
                 </div>
             )}
             <div className="max-w-xl mx-auto flex flex-col gap-3 relative" style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}>
                 
                 <div className="flex justify-between items-center mb-1">
                     <div className="flex items-center gap-2 text-custom-500">
                         <Wrench className="w-4 h-4" />
                         <span className="text-xs font-bold font-mono uppercase tracking-widest">DEV_TOOLS</span>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => setShowDesc(!showDesc)} className={`px-3 py-1 ${showDesc ? 'bg-blue-900/40 text-blue-400' : 'bg-custom-900 text-custom-400'} text-xs font-bold uppercase hover:text-white rounded transition-colors`}>Info</button>
                        <button onClick={onReset} className="px-3 py-1 bg-red-900/20 text-red-500 text-xs font-bold uppercase hover:bg-red-900/40 rounded transition-colors">Reset</button>
                        <button onClick={onClose} className="px-3 py-1 bg-custom-900 text-custom-400 text-xs font-bold uppercase hover:text-white rounded transition-colors">Close</button>
                     </div>
                 </div>

                 {/* Dropdown: Category Selection */}
                 <div className="relative">
                    <select
                        value={currentCategory}
                        onChange={(e) => setCurrentCategory(e.target.value)}
                        className="w-full bg-custom-900 text-white text-xs font-bold uppercase tracking-wide p-3 rounded appearance-none outline-none border border-custom-800 focus:border-blue-500"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{SETTING_CATEGORIES[cat].label}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-custom-500">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                 </div>

                 {/* Dropdown: Parameter Selection with Arrows */}
                 <div className="flex items-center gap-2">
                     <button onClick={handlePrevKey} className="p-3 bg-custom-900 rounded hover:bg-custom-800 text-custom-400 hover:text-white transition-colors">
                         <ChevronLeft className="w-4 h-4" />
                     </button>
                     <div className="relative flex-1">
                        <select
                            value={currentKey}
                            onChange={(e) => setCurrentKeyIndex(currentKeys.indexOf(e.target.value as keyof UiSettings))}
                            className="w-full bg-custom-900 text-white text-xs font-bold uppercase tracking-wide p-3 rounded appearance-none outline-none border border-custom-800 focus:border-blue-500"
                        >
                            {currentKeys.map(key => (
                                <option key={key} value={key}>{RUSSIAN_LABELS[key]}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-custom-500">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                     </div>
                     <button onClick={handleNextKey} className="p-3 bg-custom-900 rounded hover:bg-custom-800 text-custom-400 hover:text-white transition-colors">
                         <ChevronRight className="w-4 h-4" />
                     </button>
                 </div>

                 {/* Value Adjustment (Input + Slider) */}
                 <div className="bg-custom-900/30 p-3 rounded border border-custom-900/50">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-custom-500 text-[10px] font-bold uppercase tracking-widest">ADJUST (CLICK TO RESET, LONG PRESS TO EDIT)</span>
                        {isEditing ? (
                            <input 
                                type="number"
                                autoFocus
                                value={settings[currentKey]}
                                onChange={(e) => updateSetting(currentKey, parseInt(e.target.value) || 0)}
                                onBlur={() => setIsEditing(false)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(false); }}
                                className="bg-custom-950 text-blue-400 font-mono text-base font-bold w-20 text-right px-2 py-1 rounded border border-blue-500 outline-none"
                            />
                        ) : (
                            <div 
                                onPointerDown={handleValuePointerDown}
                                onPointerUp={handleValuePointerUp}
                                onPointerLeave={handleValuePointerLeave}
                                className="bg-custom-950 text-blue-400 font-mono text-base font-bold w-20 text-right px-2 py-1 rounded border border-custom-800 outline-none cursor-pointer select-none"
                            >
                                {settings[currentKey]}
                            </div>
                        )}
                     </div>
                     <div className="flex items-center gap-3">
                         <button onClick={() => updateSetting(currentKey, Math.max(range.min, settings[currentKey] - 1))} className="w-8 h-8 flex items-center justify-center bg-custom-900 rounded hover:bg-custom-800 text-custom-400 hover:text-white transition-colors shrink-0">
                             <Minus className="w-4 h-4" />
                         </button>
                         <input 
                            type="range"
                            min={range.min}
                            max={range.max}
                            value={settings[currentKey]}
                            onChange={(e) => updateSetting(currentKey, parseInt(e.target.value))}
                            className="flex-1 h-6 bg-custom-900 rounded appearance-none cursor-pointer accent-white"
                         />
                         <button onClick={() => updateSetting(currentKey, Math.min(range.max, settings[currentKey] + 1))} className="w-8 h-8 flex items-center justify-center bg-custom-900 rounded hover:bg-custom-800 text-custom-400 hover:text-white transition-colors shrink-0">
                             <Plus className="w-4 h-4" />
                         </button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

// JSON Import Modal Component
interface JsonImportModalProps {
    onClose: () => void;
    onImport: (json: string) => void;
    uiConfig: any;
}

const JsonImportModal = ({ onClose, onImport, uiConfig }: JsonImportModalProps) => {
    const [json, setJson] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJson(e.target.value);
    };
    
    const copySystemPrompt = () => {
      const fullPrompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nUSER REQUEST: "..."`;
      navigator.clipboard.writeText(fullPrompt);
      alert("Prompt copied!");
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-0 backdrop-blur-md animate-fade-in">
             <div className={`bg-custom-950 w-full max-w-lg h-full md:h-[80vh] flex flex-col shadow-2xl relative border border-custom-900`}>
                 <div className={`flex justify-between items-center px-6 border-b border-custom-900 shrink-0 ${uiConfig.headerHeightClass}`}>
                    <h3 className={`text-white font-bold ${uiConfig.headerClassName} font-mono uppercase tracking-widest flex items-center`}>
                        <FileJson className={`${uiConfig.iconClassName} mr-3 text-indigo-500`}/> JSON_INPUT
                    </h3>
                    <button onClick={onClose} className={`text-custom-500 hover:text-white`}><X className={uiConfig.iconClassName} /></button>
                 </div>
                 
                 <div className="flex-1 min-h-0 relative">
                    <textarea 
                        ref={textareaRef}
                        value={json}
                        onChange={handleInput}
                        className={`absolute inset-0 w-full h-full bg-custom-950 text-white ${uiConfig.bodyClassName} outline-none resize-none font-mono placeholder-custom-800`}
                        style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}
                        placeholder='{ ... }'
                    />
                 </div>
                 
                 <div className={`flex border-t border-custom-900 shrink-0 ${uiConfig.headerHeightClass}`}>
                    <button 
                        onClick={onClose}
                        className={`w-14 flex items-center justify-center border-r border-custom-900 text-custom-500 hover:text-white hover:bg-custom-900 transition-colors`}
                    >
                        <ArrowLeft className={uiConfig.iconClassName} />
                    </button>
                    <button 
                         onClick={copySystemPrompt}
                         className={`flex-1 bg-custom-950 hover:bg-custom-900 text-indigo-400 hover:text-white transition-colors ${uiConfig.bodyClassName} font-bold uppercase tracking-widest border-r border-custom-900`}
                     >
                         Copy Prompt
                     </button>
                     <button 
                        onClick={() => onImport(json)}
                        disabled={!json.trim()}
                        className={`flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold ${uiConfig.bodyClassName} disabled:opacity-50 transition-colors uppercase tracking-widest`}
                     >
                        Parse & Load
                     </button>
                 </div>
             </div>
        </div>
    );
};

// --- Migration Helper ---
const migrateFormula = (f: Formula): Formula => {
    // If outputs don't exist but expression does, migrate it
    if ((!f.outputs || f.outputs.length === 0) && f.expression) {
        return {
            ...f,
            outputs: [{
                id: 'default_output',
                name: f.resultName || 'Result',
                unit: f.resultUnit || '',
                expression: f.expression
            }]
        };
    }
    return f;
}

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [previousView, setPreviousView] = useState<ViewState>('DASHBOARD');
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [activeFormula, setActiveFormula] = useState<Formula | null>(null);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [devToolsCategory, setDevToolsCategory] = useState<string | null>(null);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [startEditorWithAi, setStartEditorWithAi] = useState(false);
  
  // Customization State
  const [theme, setTheme] = useState('custom'); // Always custom to use dynamic styles
  const [rgb, setRgb] = useState(DEFAULT_RGB);
  const [uiSettings, setUiSettings] = useState<UiSettings>(DEFAULT_UI_SETTINGS);
  
  // Generate CSS for the current RGB values
  const themeCss = generateThemeCss(rgb.r, rgb.g, rgb.b, uiSettings);

  // Construct Dynamic UI Configuration from Settings
  const uiConfig = {
      headerClassName: `text-[${uiSettings.headerFontSize}px] font-[${uiSettings.weightHeader}] tracking-[${uiSettings.letterSpacingHeader}px]`,
      bodyClassName: `text-[${uiSettings.bodyFontSize}px] font-[${uiSettings.weightBody}] tracking-[${uiSettings.letterSpacingBody}px]`,
      iconClassName: `w-[${uiSettings.iconSize}px] h-[${uiSettings.iconSize}px]`,
      
      headerHeightClass: `h-[${uiSettings.headerHeight}px]`,
      rowHeightClass: `min-h-[${uiSettings.rowHeight}px]`,
      
      inputFontSize: `text-[${uiSettings.inputFontSize}px] font-[${uiSettings.weightInput}]`,
      resultFontSize: `text-[${uiSettings.resultFontSize}px]`,
      
      paddingClass: `px-[${uiSettings.screenPaddingX}px] py-[${uiSettings.screenPaddingY}px]`,
      gapClass: `gap-[${uiSettings.elementGapX}px]`,
      
      iconSize: uiSettings.iconSize,
  };
  
  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Long press refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('customcalc_formulas');
    if (saved) {
      try {
        const parsed: Formula[] = JSON.parse(saved);
        // Migrate legacy formulas on load
        const migrated = parsed.map(migrateFormula);
        setFormulas(migrated);
      } catch (e) {
        console.error("Failed to load formulas", e);
      }
    } else {
        // setShowHelp(true); // Removed automatic help modal
    }
    
    // Load Settings
    const savedSettings = localStorage.getItem('customcalc_settings_v2');
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.uiSettings) setUiSettings({...DEFAULT_UI_SETTINGS, ...parsed.uiSettings});
            if (parsed.rgb) setRgb(parsed.rgb);
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('customcalc_formulas', JSON.stringify(formulas));
  }, [formulas]);
  
  useEffect(() => {
      localStorage.setItem('customcalc_settings_v2', JSON.stringify({
          uiSettings,
          rgb
      }));
  }, [uiSettings, rgb]);

  useEffect(() => {
      if (deleteConfirmId) {
          const timer = setTimeout(() => setDeleteConfirmId(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [deleteConfirmId]);

  const handleResetSettings = () => {
      localStorage.removeItem('customcalc_settings_v2');
      setUiSettings({...DEFAULT_UI_SETTINGS});
      setRgb({...DEFAULT_RGB});
  }

  const handleUpdateSetting = (key: keyof UiSettings, val: number) => {
      setUiSettings(prev => ({...prev, [key]: val}));
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(formulas, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const date = new Date().toISOString().slice(0, 10);
    const exportFileDefaultName = `customcalc_backup_${date}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = (event) => {
            try {
                if (event.target?.result) {
                    const parsed = JSON.parse(event.target.result as string);
                    if (Array.isArray(parsed)) {
                        if (window.confirm("Overwrite current data?")) {
                            setFormulas(parsed.map(migrateFormula));
                            setShowHelp(false);
                        }
                    } else {
                        alert("Invalid file format");
                    }
                }
            } catch (error) {
                alert('Error reading file');
            }
        };
        e.target.value = '';
    }
  };

  const handleSaveFormula = (formula: Formula) => {
    // Ensure formula has valid output structure
    const processedFormula = migrateFormula(formula);
    
    const isNew = !formulas.some(f => f.id === processedFormula.id);
    setFormulas(prev => {
       const exists = prev.find(f => f.id === processedFormula.id);
       if (exists) {
         return prev.map(f => f.id === processedFormula.id ? processedFormula : f);
       }
       return [processedFormula, ...prev];
    });
    
    if (isNew) {
        setActiveFormula(processedFormula);
        setView('RUNNER');
    } else {
        if (activeFormula && activeFormula.id === processedFormula.id) {
            setActiveFormula(processedFormula);
            setView('RUNNER');
        } else {
            setView(previousView === 'RUNNER' ? 'RUNNER' : 'DASHBOARD');
        }
    }
    setEditingFormula(null);
  };

  const handleDeleteFormula = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
        setFormulas(prev => prev.filter(f => f.id !== id));
        setDeleteConfirmId(null);
        localStorage.removeItem(`calc_inputs_${id}`);
    } else {
        setDeleteConfirmId(id);
    }
  };

  const handleDeleteFromRunner = () => {
      if (activeFormula) {
          setFormulas(prev => prev.filter(f => f.id !== activeFormula.id));
          localStorage.removeItem(`calc_inputs_${activeFormula.id}`);
          setActiveFormula(null);
          setView('DASHBOARD');
      }
  };

  const handleEditFormula = (e: React.MouseEvent, formula: Formula) => {
    e.stopPropagation();
    setEditingFormula(formula);
    setActiveFormula(null); 
    setStartEditorWithAi(false);
    setPreviousView('DASHBOARD');
    setView('EDITOR');
  };

  const handleCreateNew = () => {
    setEditingFormula(null);
    setActiveFormula(null);
    setStartEditorWithAi(false);
    setPreviousView('DASHBOARD');
    setView('EDITOR');
  };

  const handleCreateWithAi = () => {
    setEditingFormula(null);
    setActiveFormula(null);
    setStartEditorWithAi(true);
    setPreviousView('DASHBOARD');
    setView('EDITOR');
  }

  const handleOpenFormula = (formula: Formula) => {
    if (deleteConfirmId === formula.id) {
        setDeleteConfirmId(null);
        return;
    }
    setActiveFormula(migrateFormula(formula));
    setView('RUNNER');
  };

  const handleEditFromRunner = () => {
    if (activeFormula) {
        setEditingFormula(activeFormula);
        setStartEditorWithAi(false);
        setPreviousView('RUNNER');
        setView('EDITOR');
    }
  };

  // Long Press Handlers
  const handleButtonDown = () => {
      isLongPress.current = false;
      timerRef.current = setTimeout(() => {
          isLongPress.current = true;
          if (navigator.vibrate) navigator.vibrate(50);
          setShowJsonImport(true);
      }, 500);
  };

  const handleButtonUp = () => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }
      if (!isLongPress.current && !showJsonImport) {
          handleCreateNew();
      }
  };

  const handleJsonImportAction = (jsonString: string) => {
      try {
          const result = cleanAndParseJSON(jsonString);
          const newFormula: Formula = {
              id: Date.now().toString(),
              title: result.title || "Untitled",
              description: result.explanation || "",
              expression: "", // Deprecated
              resultName: "", // Deprecated
              resultUnit: "", // Deprecated
              outputs: result.outputs.map((o, idx) => ({
                  id: Date.now().toString() + "_out_" + idx,
                  name: o.name,
                  unit: o.unit,
                  expression: o.expression
              })),
              variables: result.variables.map((v: any, idx: number) => ({
                  id: Date.now().toString() + "_var_" + idx,
                  name: v.name,
                  symbol: v.symbol,
                  unit: v.unit
              })),
              color: `bg-custom-950`,
              icon: 'calculator',
              aiJson: jsonString
          };
          
          // IMMEDIATE SAVE AND RUN
          handleSaveFormula(newFormula);
          setShowJsonImport(false);
      } catch (e) {
          alert("JSON Parse Failed");
      }
  };

  const filteredFormulas = formulas.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-custom-950 text-custom-300 font-sans selection:bg-blue-500/30 flex flex-col items-center`}>
      <style>{themeCss}</style>
      
      {/* Centered container with maxWidth setting */}
      <div className="w-full flex flex-col h-full shadow-2xl relative" style={{ maxWidth: `${uiSettings.maxWidth}px` }}>

      {showHelp && (
        <HelpModal 
            onClose={() => setShowHelp(false)} 
            onExport={handleExportData}
            onImport={handleImportData}
            
            rgb={rgb}
            setRgb={setRgb}
            settings={uiSettings}
            updateSetting={handleUpdateSetting}
            onReset={handleResetSettings}
            
            uiConfig={uiConfig} 
        />
      )}
      
      {devToolsCategory !== null && (
          <DevToolWidget 
            onClose={() => setDevToolsCategory(null)}
            settings={uiSettings}
            updateSetting={handleUpdateSetting}
            onReset={handleResetSettings}
            uiConfig={uiConfig}
            initialCategory={devToolsCategory}
          />
      )}
      
      {showJsonImport && (
        <JsonImportModal 
            onClose={() => setShowJsonImport(false)}
            onImport={handleJsonImportAction}
            uiConfig={uiConfig}
        />
      )}

      {view === 'DASHBOARD' && (
          <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className={`bg-custom-950 shrink-0 sticky top-0 z-20 flex justify-between items-center ${uiConfig.headerHeightClass} border-b border-custom-900`} style={{ paddingLeft: 'var(--header-padding-x)', paddingRight: 'var(--header-padding-x)', paddingTop: 'var(--header-padding-y)', paddingBottom: 'var(--header-padding-y)' }}>
                 <button onClick={() => setDevToolsCategory('DASHBOARD')} className={`text-custom-600 hover:text-white transition-colors p-2`}>
                     <Wrench className={uiConfig.iconClassName} />
                 </button>
                 <h1 className={`${uiConfig.headerClassName} font-bold text-white flex items-center font-mono`}>
                    CCS<span className="text-blue-500">_</span>V2
                 </h1>
                 <button onClick={() => setShowHelp(true)} className={`text-custom-600 hover:text-white transition-colors p-2`}>
                    <Settings className={uiConfig.iconClassName} />
                 </button>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto pb-[${uiSettings.footerHeight}px] scroll-smooth`}>
                {formulas.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-[60vh] text-custom-600`}>
                        <div className="mb-4 font-mono text-8xl opacity-10 font-bold">00</div>
                        <h3 className={`text-white font-bold ${uiConfig.headerClassName} mb-2 font-mono uppercase tracking-widest`}>System_Empty</h3>
                        <button 
                            onPointerDown={handleButtonDown}
                            onPointerUp={handleButtonUp}
                            onPointerLeave={() => { if(timerRef.current) clearTimeout(timerRef.current); }}
                            className={`text-blue-500 hover:text-blue-400 ${uiConfig.bodyClassName} font-bold font-mono tracking-widest mt-8 border-b border-blue-500/30 pb-1`}
                        >
                            INITIATE_NEW
                        </button>
                    </div>
                ) : (
                    <div 
                        className={isGridView ? `grid grid-cols-2 bg-custom-900 border-b border-custom-900` : `flex flex-col divide-y divide-custom-900`}
                        style={{ gap: isGridView ? `${uiSettings.gridGap}px` : `${uiSettings.listGap}px` }}
                    >
                        {filteredFormulas.map(formula => {
                           const isDeleteArmed = deleteConfirmId === formula.id;

                           if (isGridView) {
                               return (
                                 <div 
                                    key={formula.id}
                                    onClick={() => handleOpenFormula(formula)}
                                    className={`group relative bg-card-base hover:bg-custom-900 cursor-pointer flex flex-col justify-between transition-colors ${isDeleteArmed ? 'bg-red-900/10' : ''}`}
                                    style={{ 
                                        minHeight: `${uiSettings.gridRowHeight}px`,
                                        padding: `${uiSettings.cardPaddingY}px ${uiSettings.cardPaddingX}px`
                                    }}
                                 >
                                    <div className="flex justify-between items-start w-full relative">
                                        <h3 className={`${uiConfig.bodyClassName} font-bold text-white leading-tight mb-1 line-clamp-2 font-mono uppercase tracking-wide`}>{formula.title}</h3>
                                        
                                        <div className={`absolute -top-3 -right-3 flex flex-col gap-0 transition-opacity ${isDeleteArmed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {!isDeleteArmed && (
                                                <button 
                                                    onClick={(e) => handleEditFormula(e, formula)} 
                                                    className={`p-2 text-custom-600 hover:text-blue-400`}
                                                >
                                                    <Edit2 className={uiConfig.iconClassName}/>
                                                </button>
                                            )}
                                             <button 
                                                onClick={(e) => handleDeleteFormula(e, formula.id)} 
                                                className={`p-2 transition-all ${isDeleteArmed ? 'text-red-500' : `text-custom-600 hover:text-red-400`}`}
                                            >
                                                <Trash2 className={uiConfig.iconClassName}/>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-1">
                                        <p className={`${uiConfig.bodyClassName} opacity-60 text-custom-600 font-mono truncate`}>
                                            {formula.outputs && formula.outputs.length > 0 ? formula.outputs[0].expression : 'No Logic'}
                                        </p>
                                    </div>
                                 </div>
                               );
                           } else {
                               return (
                                 <div 
                                    key={formula.id}
                                    onClick={() => handleOpenFormula(formula)}
                                    className={`group relative bg-card-base hover:bg-custom-900 cursor-pointer flex items-center transition-colors ${isDeleteArmed ? 'bg-red-900/10' : ''}`}
                                    style={{ 
                                        minHeight: `${uiSettings.rowHeight}px`,
                                        gap: `${uiSettings.elementGapX}px`,
                                        padding: `${uiSettings.cardPaddingY}px ${uiSettings.cardPaddingX}px`
                                    }}
                                 >
                                    <div className="flex-1 min-w-0 text-left">
                                        <h3 className={`${uiConfig.headerClassName} font-bold text-white leading-tight mb-1 truncate font-mono uppercase tracking-wide`}>
                                            {formula.title}
                                        </h3>
                                        <p className={`${uiConfig.bodyClassName} opacity-60 text-custom-600 truncate font-mono`}>
                                            {formula.outputs && formula.outputs.length > 0 ? formula.outputs[0].expression : 'No Logic'}
                                        </p>
                                    </div>

                                    <div className={`flex items-center`} style={{ gap: `${uiSettings.elementGapX}px`}}>
                                        <button onClick={(e) => handleEditFormula(e, formula)} className={`text-custom-600 hover:text-blue-400`}><Edit2 className={uiConfig.iconClassName}/></button>
                                        <button 
                                            onClick={(e) => handleDeleteFormula(e, formula.id)} 
                                            className={`transition-all ${isDeleteArmed ? 'text-red-500' : `text-custom-600 hover:text-red-400`}`}
                                        >
                                            <Trash2 className={uiConfig.iconClassName}/>
                                        </button>
                                    </div>
                                 </div>
                               );
                           }
                        })}
                    </div>
                )}
            </div>
            
            {/* Bottom Controls Bar (Borderless) */}
            <div className={`bg-custom-950 border-t border-custom-900 p-0 fixed bottom-0 z-30 flex safe-area-pb`} 
                style={{ 
                    height: `${uiSettings.footerHeight}px`,
                    maxWidth: `${uiSettings.maxWidth}px`,
                    width: '100%'
                }}
            >
                 <button 
                    onClick={handleCreateWithAi}
                    className={`flex-1 flex items-center justify-center text-indigo-400 hover:text-white hover:bg-custom-900 transition-colors border-r border-custom-900`}
                 >
                     <Sparkles className={uiConfig.iconClassName} />
                 </button>

                 <div className={`relative flex-[3] flex items-center border-r border-custom-900`} style={{ height: `${uiSettings.searchBarHeight}px`, alignSelf: 'center', paddingLeft: 'var(--search-bar-padding-x)', paddingRight: 'var(--search-bar-padding-x)', paddingTop: 'var(--search-bar-padding-y)', paddingBottom: 'var(--search-bar-padding-y)' }}>
                    <input 
                      type="text" 
                      placeholder="SEARCH_DB" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full h-full bg-transparent text-white ${uiConfig.bodyClassName} font-mono outline-none placeholder-custom-700 uppercase`}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className={`absolute right-4 text-custom-600 hover:text-white`}
                        >
                            <X className={uiConfig.iconClassName} />
                        </button>
                    )}
                 </div>
                 <button 
                    onClick={() => setIsGridView(!isGridView)} 
                    className={`flex-1 flex items-center justify-center text-custom-500 hover:text-white hover:bg-custom-900 transition-colors border-r border-custom-900`}
                 >
                    {isGridView ? <List className={uiConfig.iconClassName}/> : <Grid className={uiConfig.iconClassName}/>}
                 </button>
                 <button 
                    onPointerDown={handleButtonDown}
                    onPointerUp={handleButtonUp}
                    onPointerLeave={() => { if(timerRef.current) clearTimeout(timerRef.current); }}
                    onContextMenu={(e) => e.preventDefault()}
                    className="flex-1 flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 transition-colors active:bg-blue-400 select-none touch-none"
                 >
                    <Plus className={uiConfig.iconClassName} />
                 </button>
            </div>
          </div>
        )}

        {view === 'EDITOR' && (
          <FormulaEditor 
            initialFormula={editingFormula}
            onSave={handleSaveFormula}
            onCancel={() => setView(previousView)} 
            startWithAi={startEditorWithAi}
            theme={theme}
            uiConfig={uiConfig}
            onOpenSettings={() => setShowHelp(true)}
            onOpenDevTools={() => setDevToolsCategory('EDITOR')}
          />
        )}

        {view === 'RUNNER' && activeFormula && (
          <FormulaRunner 
            formula={activeFormula}
            onBack={() => setView('DASHBOARD')}
            onEdit={handleEditFromRunner}
            onDelete={handleDeleteFromRunner}
            theme={theme}
            uiConfig={uiConfig}
            onOpenSettings={() => setShowHelp(true)}
            onOpenDevTools={() => setDevToolsCategory('RUNNER')}
          />
        )}
      </div>
    </div>
  );
}