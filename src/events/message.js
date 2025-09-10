const { InlineKeyboard } = require("grammy");
const { developerId } = require("../config");
const { Days } = require("../models");
const { createAttachmentData, getAttachmentByMediaGroupId, getAttachmentValueFromCtx, checkMsgMediaGroup } = require("../utils/attachments-functions");
const { sendActionLog } = require("../utils/logging-functions");
const { getDayScheduleById, showManageDay, getSubgroups } = require("../utils/schedule-functions");
const { getUserData, setWait } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

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
                    return void await errorAnswer(ctx, 'Неизвестный тип вложения\nПоддерживаемые форматы: ссылки, фотографии, аудио- и видеофайлы, гифки, файлы, голосовые сообщения', { deleteAfter: 15 });

                const attachmentData = await createAttachmentData(value, wait.attachmentName, wait.lessonIndex, data.id, { mediaGroupId });
                const attachment = {
                    name: wait.attachmentName,
                    id: attachmentData.id,
                };
                if (!lessonData.attachments?.length) {
                    lessonData.attachments = [attachment];
                } else {
                    lessonData.attachments.push(attachment);
                }

                data.changed('lessons', true);
                await data.save();

                await setWait(ctx.from.id, {});

                await showManageDay(ctx, data.weekId, data.index, { editMessageId: wait.editMessageId });

                await sendActionLog(ctx, 'Добавлено вложение', [
                    `Значение: ${JSON.stringify({ ...value, attachmentName: wait.attachmentName }, null, 2)}`,
                    `Урок: ${lessonData.name}`,
                    `Индекс урока: ${wait.lessonIndex}`,
                    `Айди дня: ${data.id}`,
                    `Айди недели: ${data.weekId}`,
                ]);
            }
        }

    }
};
