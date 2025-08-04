const { InlineKeyboard } = require("grammy");
const { Users } = require("../models");
const { developerId } = require("../config");
const { errorAnswer } = require("./utils");

async function getUserData(userId) {
    const bot = require('../index');

    const [data] = await Users.findOrCreate({
        where: { userId },

        defaults: { userId },
    });

    bot.logger.info('Запрос юзердаты', { data, userId });

    return data;

}

async function setWait(userId, waitData) {

    const bot = require('../index');

    const data = await getUserData(userId);

    data.wait = waitData;

    await Users.update({ wait: data.wait }, { where: { id: data.id } });

    bot.logger.info('Обновление ожидания от пользователя', { data });

    return data.wait;

}

async function checkAdminPerms(userId) {
    const userdata = await getUserData(userId);

    return userdata.group === 'admin' || userdata.group === 'developer';
}

async function setPrefix(userId, prefix = '') {
    const bot = require('..');

    const userdata = await getUserData(userId);

    userdata.prefix = prefix;
    await userdata.save();

    bot.logger.info(`Установка префикса`, { userId, prefix });

    return userdata;
}

async function setGroup(userId, group) {
    const bot = require('..');

    const userdata = await getUserData(userId);

    userdata.group = group;
    await userdata.save();

    bot.logger.info(`Установка группы`, { userId, group });

    return userdata;
}

async function sendGoAdminRules(ctx) {

    const isAdmin = await checkAdminPerms(ctx.from.id);
    if (isAdmin)
        return void await errorAnswer(ctx, 'Тебе <b>уже выданы</b> админ права');

    const inline = new InlineKeyboard()
        .text('Хочу помочь', 'go_admin?:go')
        .row()
        .text('Отменить', 'cancel');

    const text = `Став <b>администратором</b>, ты <b>получишь</b> доступ к редактированию расписания и сможешь <b>помогать</b> нам в актуализации расписания.
    `.replace(/  +/g, '');

    await ctx.reply(text, {
        reply_markup: inline,
        parse_mode: 'HTML',
    });

}

async function sendGoAdminRequest(ctx) {
    const bot = require('..');

    const inline = new InlineKeyboard()
        .text('Принять', `go_admin?:accept?:${ctx.from.id}`)
        .text('Отклонить', `cancel`);

    const text = `Запрос на получение <b>админ прав</b> от <b>${ctx.from.username || `${ctx.from.first_name} ${ctx.from.last_name}`}</b> | <code>${ctx.from.id}</code>.
    `.replace(/  +/g, '');

    try {
        await ctx.api.sendMessage(developerId, text, {
            reply_markup: inline,
            parse_mode: 'HTML',
        });

        await ctx.editMessageText(`Твой запрос <b>успешно отправлен</b>, осталось немного подождать.`, {
            parse_mode: 'HTML',
        });
    } catch (error) {
        bot.logger.error(`Возникла ошибка при отправке запроса на получение админ прав:\n${error.stack}`, { ctx });
        await ctx.editMessageText(`<b>Возникла непредвиденная ошибка</b>\nПожалуйста, попробуй ещё раз`);
    }

}

async function answerGoAdminRequest(ctx, action, targetUserId) {
    const bot = require('..');

    if (action === 'accept') {
        try {
            await setGroup(targetUserId, 'admin');

            const text = ctx.msg.text + `\n<b>Принято</b>`;
            await ctx.editMessageText(text, {
                parse_mode: 'HTML',
            });

            await ctx.api.sendMessage(targetUserId, `<b>Привет!</b> Твой запрос на получение <b>админ прав</b> одобрен, теперь ты <b>можешь посмотреть</b> доступные команды с помощью <b>/help</b>.\n💖 Спасибо за помощь!`, {
                message_effect_id: '5104841245755180586',
                parse_mode: 'HTML',
            })
                .catch(() => { });
        } catch (error) {
            bot.logger.error(`Возникла ошибка при установке группы админ:\n${error.stack}`, { ctx });
            await ctx.editMessageText(`<b>Возникла непредвиденная ошибка</b>`);
        }
    } else {
        const text = ctx.msg.text + `\n<b>Отклонено</b>`;
        await ctx.editMessageText(text, {
            parse_mode: 'HTML',
        });
    }
}

async function showUserManagePanel(ctx, targetUserId, { reply = true } = {}) {
    const userdata = await getUserData(targetUserId);

    if (!userdata)
        return void await errorAnswer(ctx, `Пользователь не найден`, {
            deleteAfter: 5
        });

    if (userdata.group === 'developer')
        return void await errorAnswer(ctx, 'Перепроверь айдишник', {
            deleteAfter: 5
        });

    const inline = new InlineKeyboard();

    if (userdata.group === 'admin') {
        inline.text('Снять админку', `user_manage?:${targetUserId}?:admin?:take`);
    } else {
        inline.text('Выдать админку', `user_manage?:${targetUserId}?:admin?:set`);
    }

    const text = `<b>Управление пользователем <code>${targetUserId}</code></b>`;

    const action = (reply)
        ? 'reply'
        : 'editMessageText';

    await ctx[action](text, {
        parse_mode: 'HTML',
        reply_markup: inline,
    });

}

module.exports = {
    getUserData,
    setWait,
    checkAdminPerms,
    setPrefix,
    setGroup,
    sendGoAdminRules,
    sendGoAdminRequest,
    answerGoAdminRequest,
    showUserManagePanel,
};
