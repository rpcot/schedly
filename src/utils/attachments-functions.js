const { InlineKeyboard } = require("grammy");
const { Attachments } = require("../models");
const { isUrl, capitalize, errorAnswer } = require("./utils");
const { sendActionLog } = require("./logging-functions");

/**
 * 
 * @param {{
 *  fileId?: string
 *  fileUniqueId?: string
 *  fileType?: 'photo' | 'link' | 'video' | 'animation' | 'audio' | 'document' | 'voice'
 *  content?: string
 * }} value
 * @param {string | null} name
 * @param {number} dayId 
 * @param {{ mediaGroupId: number | null }} options
 */
async function createAttachmentData(value, name, lessonIndex, dayId, { mediaGroupId = null } = {}) {
    const bot = require('../');

    const attachmentData = await Attachments.create({
        value,
        name,
        dayId,
        mediaGroupId,
        lessonIndex,
    });

    bot.logger.info('Создано новое вложение', { attachmentData });

    return attachmentData;
}

async function getAttachment(id) {
    const bot = require('../');

    const attachmentData = await Attachments.findByPk(id);

    bot.logger.info('Запрос вложения', { id, attachmentData });

    return attachmentData;
}

async function getAttachmentByMediaGroupId(mediaGroupId) {
    const bot = require('../');

    const attachmentData = await Attachments.findOne({
        where: { mediaGroupId },
    });

    bot.logger.info('Запрос вложения', { mediaGroupId, attachmentData });

    return attachmentData;
}

async function getAttachmentValueFromCtx(ctx) {
    let value = null;
    switch (true) {
        case isUrl(ctx.msg.text):
            value = {
                content: ctx.msg.text,
                type: 'link',
            };
            break;
        case !!ctx.msg.photo?.length:
            value = {
                fileId: ctx.msg.photo.at(-1).file_id,
                fileUniqueId: ctx.msg.photo.at(-1).file_unique_id,
                type: 'photo',
                mimeType: 'image/png',
            };
            break;
        case !!ctx.msg.animation:
            value = {
                fileId: ctx.msg.animation.file_id,
                fileUniqueId: ctx.msg.animation.file_unique_id,
                fileName: ctx.msg.animation.file_name,
                type: 'animation',
                mimeType: ctx.msg.animation.mime_type,
            };
            break;
        case !!ctx.msg.audio:
            value = {
                fileId: ctx.msg.audio.file_id,
                fileUniqueId: ctx.msg.audio.file_unique_id,
                fileName: ctx.msg.audio.file_name,
                type: 'audio',
                mimeType: ctx.msg.audio.mime_type,
            };
            break;
        case !!ctx.msg.document:
            value = {
                fileId: ctx.msg.document.file_id,
                fileUniqueId: ctx.msg.document.file_unique_id,
                fileName: ctx.msg.document.file_name,
                type: 'document',
                mimeType: ctx.msg.document.mime_type,
            };
            break;
        case !!ctx.msg.voice:
            value = {
                fileId: ctx.msg.voice.file_id,
                fileUniqueId: ctx.msg.voice.file_unique_id,
                fileName: ctx.msg.voice.file_name,
                type: 'voice',
                mimeType: ctx.msg.voice.mime_type,
            };
            break;
        case !!ctx.msg.video:
            value = {
                fileId: ctx.msg.video.file_id,
                fileUniqueId: ctx.msg.video.file_unique_id,
                fileName: ctx.msg.video.file_name,
                type: 'video',
                mimeType: ctx.msg.video.mime_type,
            };
            break;
    }

    return value;
}

async function showAttachment(ctx, lessonData, attachmentId) {
    const bot = require('../');

    const inline = new InlineKeyboard()
        .text('Скрыть', `hide_attachment`);

    const attachmentData = await getAttachment(attachmentId);
    if (!attachmentData) {
        return void await ctx.reply('Вложение не найдено', {
            reply_markup: inline,
        });
    }

    const title = `[<code>${attachmentData.id}</code>] <b>${attachmentData.name || `Вложение ${attachmentData.id}`}</b>
    • Добавлено ${attachmentData.createdAt.toLocaleString('ru-RU')}
    • Относится к уроку ${lessonData.name}`.replace(/  +/g, '');

    try {
        if (attachmentData.value.type === 'link') {
            const inline = new InlineKeyboard()
                .url('Открыть', attachmentData.value.content)
                .row()
                .text('Скрыть', `hide_attachment`);

            await ctx.reply(`${title}\n\nССЫЛКА: <b>${attachmentData.value.content}</b>`, {
                reply_markup: inline,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
        } else {
            const method = `replyWith${capitalize(attachmentData.value.type)}`;
            await ctx[method](attachmentData.value.fileId, {
                parse_mode: 'HTML',
                caption: title,
                reply_markup: inline,
            });
        }
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке вложения:\n${error.stack}`);
        await errorAnswer(ctx, 'Возникла непредвиденная ошибка при отправке вложения', {
            deleteAfter: 5,
        });
    }
}

async function checkMsgMediaGroup(ctx, mediaGroupId) {
    try {
        const attachmentData = await getAttachmentByMediaGroupId(mediaGroupId);

        if (!attachmentData) return;

        await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id)
            .catch(() => { });

        const day = await attachmentData.getDay();

        const lessonData = day.lessons[attachmentData.lessonIndex];

        if (lessonData?.attachments?.length >= 5)
            return void await errorAnswer(ctx, 'Для данного урока достигнуто максимальное количество вложений', {
                deleteAfter: 5,
            });

        const value = await getAttachmentValueFromCtx(ctx);
        if (!value) return;

        const newAttachmentData = await createAttachmentData(value, attachmentData.name, attachmentData.lessonIndex, attachmentData.dayId, { mediaGroupId });

        lessonData.attachments.push({
            id: newAttachmentData.id,
            name: newAttachmentData.name,
        });
        day.lessons[attachmentData.lessonIndex] = lessonData;
        day.changed('lessons', true);
        await day.save();

        await sendActionLog(ctx, 'Добавлено вложение', [
            `Значение: ${JSON.stringify({ ...value, attachmentName: newAttachmentData.attachmentName }, null, 2)}`,
            `Урок: ${lessonData.name}`,
            `Индекс урока: ${newAttachmentData.lessonIndex}`,
            `Айди дня: ${day.id}`,
            `Айди недели: ${day.weekId}`,
        ]);
    } catch (_) {}
}

module.exports = {
    createAttachmentData,
    getAttachment,
    getAttachmentByMediaGroupId,
    getAttachmentValueFromCtx,
    showAttachment,
    checkMsgMediaGroup,
};
