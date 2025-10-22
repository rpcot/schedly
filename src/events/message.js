const { InlineKeyboard } = require("grammy");
const { developerId } = require("../config");
const { Days } = require("../models");
const { createAttachmentData, getAttachmentByMediaGroupId, getAttachmentValueFromCtx, checkMsgMediaGroup } = require("../utils/attachments-functions");
const { sendActionLog, sendChangeDayNoteLog } = require("../utils/logging-functions");
const { getDayScheduleById, showManageDay, getSubgroups } = require("../utils/schedule-functions");
const { getUserData, setWait } = require("../utils/users-functions");
const { errorAnswer, isUrl } = require("../utils/utils");
const { createTempChangelogEntry, updateTempChangelogEntry, getTempChangelogById, getChangelogsConfig, showTempChangelog } = require("../utils/changelog-functions");

module.exports = {
    name: 'msg',
    async execute(bot, ctx) {

        if (ctx.chat.type !== 'private') return;

        const mediaGroupId = ctx.msg.media_group_id || null;
        if (mediaGroupId) {
            await checkMsgMediaGroup(ctx, mediaGroupId);
        }

        const { wait } = await getUserData(ctx.from.id);

        if (wait?.id) {
            if (wait.id === 'add_note') {

                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const data = await getDayScheduleById(wait.dataId);

                if (!data)
                    return void await setWait(ctx.from.id, {});

                data.note = ctx.msg.text.slice(-100);
                await data.save();

                await showManageDay(ctx, data.weekId, data.index, { editMessageId: wait.editMessageId });

                await setWait(ctx.from.id, {});

                await sendChangeDayNoteLog(ctx, data);

                await sendActionLog(ctx, 'Добавлено примечание', [
                    `Текст: ${data.note}`,
                    `Айди дня: ${data.id}`,
                    `Айди недели: ${data.weekId}`,
                ]);

            } else if (wait.id === 'add_exam') {

                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const data = await getDayScheduleById(wait.dataId);

                if (!data)
                    return void await setWait(ctx.from.id, {});

                data.lessons[wait.lessonIndex].exam = ctx.msg.text.slice(0, 100);
                await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

                await showManageDay(ctx, data.weekId, data.index, { editMessageId: wait.editMessageId });

                await setWait(ctx.from.id, {});

                const lessonData = data.lessons[wait.lessonIndex];

                await sendActionLog(ctx, 'Добавлена проверочная работа', [
                    `Текст: ${ctx.msg.text.slice(0, 100)}`,
                    `Урок: ${lessonData.name}`,
                    `Индекс урока: ${wait.lessonIndex}`,
                    `Айди дня: ${data.id}`,
                    `Айди недели: ${data.weekId}`,
                ]);

            } else if (wait.id === 'add_homework') {

                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const data = await getDayScheduleById(wait.dataId);

                if (data.lessons[wait.lessonIndex].homework.length >= 3)
                    return void await errorAnswer(ctx, `Для данного урока достигнуто максимальное количество домашних заданий`, { deleteAfter: 5 });

                let homeworkText = ctx.msg.text.slice(0, 300);
                if (wait.teacherId) {
                    const { teachers } = await getSubgroups();
                    homeworkText = (wait.teacherId === 'all')
                        ? `для всех: ${homeworkText}`
                        : `группа ${teachers[wait.teacherId]}: ${homeworkText}`;
                }

                const targetLessonData = data.lessons[wait.lessonIndex];

                for (const lesson of data.lessons) {
                    if (lesson.name === targetLessonData.name && lesson.homework.length < 3) {
                        lesson.homework.push(homeworkText);
                    }
                }
                await Days.update({ lessons: data.lessons }, { where: { id: data.id } });

                await showManageDay(ctx, data.weekId, data.index, { editMessageId: wait.editMessageId });

                await setWait(ctx.from.id, {});

                const lessonData = data.lessons[wait.lessonIndex];

                await sendActionLog(ctx, 'Добавлено домашнее задание', [
                    `Текст: ${ctx.msg.text.slice(0, 110)}`,
                    `Урок: ${lessonData.name}`,
                    `Индекс урока: ${wait.lessonIndex}`,
                    `Айди дня: ${data.id}`,
                    `Айди недели: ${data.weekId}`,
                ]);

            } else if (wait.id === 'feedback') {
                try {
                    await ctx.api.editMessageReplyMarkup(ctx.chat.id, wait.deleteMessageId, [])
                        .catch((error) => { console.log(error) });

                    await ctx.api.sendMessage(developerId, `<b>Новое сообщение с обратной связью:</b>\n${ctx.from.username || `${ctx.from.first_name} ${ctx.from.last_name}`} | <code>${ctx.from.id}</code>`, {
                        parse_mode: 'HTML',
                    });

                    await ctx.api.forwardMessage(developerId, ctx.chat.id, ctx.msg.message_id);

                    await ctx.reply(`💖 <b>Спасибо за обратную связь</b>, твоё сообщение <b>отправлено</b> разработчику.\nВ случае чего, разработчик свяжется с тобой <b>в ЛС</b>.`, {
                        parse_mode: 'HTML',
                        message_effect_id: '5159385139981059251',
                        reply_parameters: {
                            message_id: ctx.msg.message_id,
                        },
                    });

                    await setWait(ctx.from.id, {});
                } catch (error) {
                    bot.logger.error(`Возникла ошибка при оптравке фидбека:\n${error.stack}`, { ctx });
                    await errorAnswer(ctx, `<b>Возникла непредвиденная ошибка</b>\nПожалуйста, попробуй ещё раз`, {
                        deleteAfter: 5,
                    });
                }
            } else if (wait.id === 'add_attachment_name') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const data = await getDayScheduleById(wait.dataId);

                const attachmentName = ctx.msg.text.slice(0, 50);

                await setWait(ctx.from.id, { ...wait, id: 'add_attachment', attachmentName });

                const inline = new InlineKeyboard()
                    .text('Отменить', `back_manage_day?:${ctx.from.id}?:${wait.dataId}`);

                const text = `Отправь вложение для ${wait.lessonIndex + 1} урока ${data.lessons[wait.lessonIndex].name}
                Это может быть видео, аудио, фото, файл, гифка, кружок, гс или ссылка на какой-то ресурс.
                `.replace(/  +/g, '');

                await ctx.api.editMessageText(ctx.chat.id, wait.editMessageId, text, {
                    reply_markup: inline,
                });
            } else if (wait.id === 'add_attachment') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                const data = await getDayScheduleById(wait.dataId);
                const lessonData = data.lessons[wait.lessonIndex];

                const mediaGroupId = ctx.msg.media_group_id || null;

                const value = await getAttachmentValueFromCtx(ctx);
                if (!value)
                    return void await errorAnswer(ctx, 'Неизвестный тип вложения\nПоддерживаемые форматы: ссылки, текст, фотографии, аудио- и видеофайлы, гифки, файлы, голосовые сообщения', { deleteAfter: 15 });

                const attachmentData = await createAttachmentData(value, wait.attachmentName, wait.lessonIndex, data.id, { mediaGroupId });
                const attachment = {
                    name: wait.attachmentName,
                    id: attachmentData.id,
                };

                for (const lesson of data.lessons) {
                    if (lesson.name !== lessonData.name) continue;

                    lesson.attachments ??= [];
                    lesson.attachments.push(attachment);
                }

                data.changed('lessons', true);
                await data.save();

                await setWait(ctx.from.id, {});

                await showManageDay(ctx, data.weekId, data.index, { editMessageId: wait.editMessageId });

                await sendActionLog(ctx, 'Добавлено вложение', [
                    `Значение: ${JSON.stringify({ ...value, attachmentName: wait.attachmentName, mediaGroupId: attachmentData.mediaGroupId }, null, 2)}`,
                    `Урок: ${lessonData.name}`,
                    `Индекс урока: ${wait.lessonIndex}`,
                    `Айди дня: ${data.id}`,
                    `Айди недели: ${data.weekId}`,
                ]);
            } else if (wait.id === 'changelog_name') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const title = ctx.msg.text.slice(0, 255);

                const { id, data } = createTempChangelogEntry();
                data.title = title;
                updateTempChangelogEntry(id, data);

                await setWait(ctx.from.id, { ...wait, id: 'changelog_version', tempChangelogId: id });

                const inline = new InlineKeyboard()
                    .text('Отменить', 'cancel');

                await ctx.api.editMessageText(ctx.chat.id, wait.editMessageId, 'Укажи глобальную версию', {
                    reply_markup: inline,
                });
            } else if (wait.id === 'changelog_version') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const version = ctx.msg.text;

                if (!/^v\d+\.\d+\.\d+$/.test(version))
                    return void await errorAnswer(ctx, `Версия должна быть вида v1.0.0`, { deleteAfter: 5 });

                const data = getTempChangelogById(wait.tempChangelogId);
                data.version = version;
                updateTempChangelogEntry(wait.tempChangelogId, data);

                await setWait(ctx.from.id, { ...wait, id: 'changelog_date' });

                const inline = new InlineKeyboard()
                    .text('Отменить', 'cancel');

                const text = `Укажи дату ченджлога в формате <code>YYYY-MM-DDThh:mm:ss+03:00</code>
                (Сегодня: <code>${new Date().toISOString()}</code>)`
                    .replace(/  +/g, '');

                await ctx.api.editMessageText(ctx.chat.id, wait.editMessageId, text, {
                    reply_markup: inline,
                    parse_mode: 'HTML',
                });
            } else if (wait.id === 'changelog_date') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const date = new Date(ctx.msg.text);

                if (date == 'Invalid Date')
                    return void await errorAnswer(ctx, `Дата должна быть вида YYYY-MM-DDThh:mm:ss+hh:mm`, { deleteAfter: 5 });

                const data = getTempChangelogById(wait.tempChangelogId);
                data.date = date;
                updateTempChangelogEntry(wait.tempChangelogId, data);

                await setWait(ctx.from.id, {});

                const changelogData = await getChangelogsConfig();

                const inline = new InlineKeyboard();

                for (const type of Object.values(changelogData.types)) {
                    inline
                        .text(type.name, `changelog?:${wait.tempChangelogId}?:set_type?:${type.id}`)
                        .row();
                }

                inline
                    .text('Отменить', 'cancel');

                await ctx.api.editMessageText(ctx.chat.id, wait.editMessageId, 'Выбери тип ченджлога', {
                    reply_markup: inline,
                });
            } else if (wait.id === 'changelog_add_body_version') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const version = ctx.msg.text;

                if (!/^v\d+\.\d+\.\d+$/.test(version))
                    return void await errorAnswer(ctx, `Версия должна быть вида v1.0.0`, { deleteAfter: 5 });

                const data = getTempChangelogById(wait.tempChangelogId);
                data.body.find((system) => system.systemId === wait.systemId).version = version;
                updateTempChangelogEntry(wait.tempChangelogId, data);

                await setWait(ctx.from.id, { ...wait, id: 'changelog_add_body' });

                const inline = new InlineKeyboard()
                    .text('Подтвердить', `changelog?:${wait.tempChangelogId}?:confirm_system?:${wait.systemId}`)
                    .row()
                    .text('Отменить', `changelog?:${wait.tempChangelogId}?:cancel`);

                await ctx.api.editMessageText(ctx.chat.id, wait.editMessageId, 'Напиши изменения в системе', {
                    reply_markup: inline,
                });
            } else if (wait.id === 'changelog_add_body') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const body = ctx.msg.text.slice(0, 500);

                const data = getTempChangelogById(wait.tempChangelogId);

                const systemItems = data.body.find((system) => system.systemId === wait.systemId).items;

                systemItems.push(body);
                updateTempChangelogEntry(wait.tempChangelogId, data);

                const text = `Напиши изменения в системе\n• ${systemItems.join('\n• ')}`;

                const inline = new InlineKeyboard()
                    .text('Подтвердить', `changelog?:${wait.tempChangelogId}?:confirm_system?:${wait.systemId}`)
                    .row()
                    .text('Отменить', `changelog?:${wait.tempChangelogId}?:cancel`);

                await ctx.api.editMessageText(ctx.chat.id, wait.editMessageId, text, {
                    parse_mode: 'HTML',
                    reply_markup: inline,
                });

                const msg = await ctx.reply(`<b>Добавлено:</b>\n${body}`, {
                    parse_mode: 'HTML',
                });

                setTimeout(async () => {
                    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id)
                        .catch(() => { });
                }, 10 * 1000);
            } else if (wait.id === 'changelog_add_image_name') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const name = ctx.msg.text.slice(0, 255);

                const data = getTempChangelogById(wait.tempChangelogId);
                data.images.push({ name, url: null });
                updateTempChangelogEntry(wait.tempChangelogId, data);

                await setWait(ctx.from.id, { ...wait, id: 'changelog_add_image_url', imageIndex: data.images.length - 1 });

                const inline = new InlineKeyboard()
                    .text('Отменить', `changelog?:${wait.tempChangelogId}?:cancel`);

                await ctx.api.editMessageText(ctx.chat.id, wait.editMessageId, 'Отправь ссылку на изображение', {
                    reply_markup: inline,
                });
            } else if (wait.id === 'changelog_add_image_url') {
                try {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
                } catch (_) { }

                if (!ctx.msg.text)
                    return void await errorAnswer(ctx, `Сообщение должно содержать текст`, { deleteAfter: 5 });

                const url = ctx.msg.text;

                if (!isUrl(url))
                    return void await errorAnswer(ctx, `Ссылка должна быть валидной`, { deleteAfter: 5 });

                const data = getTempChangelogById(wait.tempChangelogId);
                data.images[wait.imageIndex].url = url;
                updateTempChangelogEntry(wait.tempChangelogId, data);

                await showTempChangelog(ctx, data, { editMessageId: wait.editMessageId });
            }
        }

    }
};
