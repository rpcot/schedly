const { changelogConfigPath } = require("../config");
const { readFileSync } = require('fs');
const { Changelogs } = require("../models");
const { generateId } = require("./utils");
const { InlineKeyboard } = require("grammy");

const TEMP_CHANGELOG_DATA = new Map();

function getChangelogsConfig() {
    return JSON.parse(readFileSync(changelogConfigPath, 'utf-8'));
}

async function createChangelogEntry(version, type, title, involvedSystems, body, images, date) {
    const bot = require('../index');

    const changelogData = await Changelogs.create({
        version,
        type,
        title,
        involvedSystems,
        body,
        images,
        date,
    });

    bot.logger.info('Создание нового ченджлога', { changelogData });

    return changelogData;
}

async function getChangelogById(id) {
    const bot = require('../index');

    const changelogData = await Changelogs.findOne({
        where: {
            id,
        },
    });

    bot.logger.info('Запрос ченджлога', { changelogData, id });

    return changelogData;
}

function createTempChangelogEntry() {
    const id = generateId(15);

    const data = {
        id,
        version: null,
        type: null,
        title: null,
        involvedSystems: [],
        body: [],
        images: [],
        date: null,
    };

    TEMP_CHANGELOG_DATA.set(id, data);

    return { id, data };
}

function getTempChangelogById(id) {
    return TEMP_CHANGELOG_DATA.get(id) ?? null;
}

function updateTempChangelogEntry(id, newData) {
    TEMP_CHANGELOG_DATA.set(id, newData);
}

function generateChangelogText(data) {
    const { systems, types } = getChangelogsConfig();

    const involvedSystemsStringView = data.involvedSystems
        .map((systemId) => systems[systemId].name)
        .join(', ') || 'Не указано';

    const bodyStringView = data.body
        .map((item) => {
            return `<i>${systems[item.systemId].name} (${item.version})</i>:
            • ${item.items.join('\n• ')}`
                .replace(/  +/g, '');
        })
        .join('\n');

    const imagesStringView = data.images
        .map((img) => `• <b>${img.name}</b>: ${img.url}`)
        .join('\n');

    const typeStringView = types[data.type].name || 'Не указано';

    const dateStringView = data.date
        ? data.date.toLocaleString('ru-RU')
        : 'Дата не указана';

    const text = `<b>Список изменений</b>
    • Версия: <b>${data.version || 'Не указано'}</b>
    • Тип: <b>${typeStringView}</b>
    • Название: <b>${data.title || 'Не указано'}</b>
    • Затронутые системы: <b>${involvedSystemsStringView}</b>

    ${bodyStringView ? `<b>Системы</b>\n${bodyStringView}` : 'Тело не указано'}

    ${imagesStringView ? `<b>Изображения</b>\n${imagesStringView}` : 'Изображения не указаны'}

    ${dateStringView}
    `.replace(/  +/g, '');

    return { isOutOfLimit: text.length > 4096, slicedText: text.slice(0, 4096) };
}

async function showTempChangelog(ctx, data, { editMessageId = false } = {}) {
    const bot = require('../index');

    const { systems } = getChangelogsConfig();

    const inline = new InlineKeyboard();

    for (const system of Object.values(systems)) {
        const isInvolved = data.involvedSystems.includes(system.id);
        const emoji = isInvolved ? '✅' : '❌';

        inline.text(`${emoji} ${system.name}`, `changelog?:${data.id}?:toggle_system?:${system.id}`);
    }

    inline
        .row()
        .text('Добавить тело', `changelog?:${data.id}?:add_body`)
        .row()
        .text('Добавить изображение', `changelog?:${data.id}?:add_image`)
        .row()
        .text('✅ Сохранить', `changelog?:${data.id}?:save`);

    const { isOutOfLimit, slicedText } = generateChangelogText(data);

    const messageOptions = {
        parse_mode: isOutOfLimit ? null : 'HTML',
        reply_markup: inline,
    };

    if (editMessageId) {
        try {
            return void await ctx.api.editMessageText(ctx.chat.id, editMessageId, slicedText, messageOptions);
        } catch (error) {
            bot.logger.error(`Не удалось изменить сообщение с информацией о временном ченджлоге\n${error.stack}`, { data });
            return void await ctx.reply(slicedText, messageOptions);
        }
    }

    await ctx.editMessageText(slicedText, messageOptions);
}

module.exports = {
    getChangelogsConfig,
    createChangelogEntry,
    getChangelogById,
    createTempChangelogEntry,
    getTempChangelogById,
    updateTempChangelogEntry,
    showTempChangelog,
};
