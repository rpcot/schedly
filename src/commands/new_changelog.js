const { InlineKeyboard } = require("grammy");
const { getUserData, showAdminsList, setWait } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    name: 'new_changelog',
    description: 'Создать новый ченджлог',
    hide: true,
    async execute(bot, ctx) {
        try {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
        } catch (_) { }

        if (ctx.chat.type !== 'private')
            return await errorAnswer(ctx, 'Данная команда доступна <b>только</b> в личных сообщениях с ботом', {
                deleteAfter: 5,
            });

        const userdata = await getUserData(ctx.from.id);
        if (userdata.group !== 'developer')
            return void await errorAnswer(ctx, `У тебя <b>нет прав</b> для использования данной команды`, {
                deleteAfter: 5
            });

        const inline = new InlineKeyboard()
            .text('Отменить', 'cancel');

        const msg = await ctx.reply('Укажи название ченджлога', {
            reply_markup: inline,
        });

        await setWait(ctx.from.id, { id: 'changelog_name', editMessageId: msg.message_id });
    }
};
