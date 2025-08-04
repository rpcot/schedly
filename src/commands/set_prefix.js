const { getUserData, setPrefix } = require("../utils/users-functions");
const { errorAnswer } = require("../utils/utils");

module.exports = {
    name: 'set_prefix',
    description: 'Установить префикс человеку',
    hide: true,
    async execute(bot, ctx) {

        try {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
        } catch(_) {}

        const userdata = await getUserData(ctx.from.id);
        if (userdata.group !== 'developer')
            return void await errorAnswer(ctx, `У тебя <b>нет прав</b> для использования данной команды`, {
                deleteAfter: 5
            });

        const args = ctx.msg.text.split(' ');

        const userId = args[1];
        const prefix = args.slice(2).join(' ');

        if (!userId)
            return void await errorAnswer(ctx, `Не указан айди пользователя`, {
                deleteAfter: 5
            });

        try {
            await setPrefix(userId, prefix);

            await ctx.reply(`Префикс <code>${userId}</code> изменён на <b>${prefix || 'по умолчанию'}</b>`, {
                parse_mode: 'HTML',
            });
        } catch (error) {
            bot.logger.error(`Возникла ошибка при установке префикса`, { ctx });
            await errorAnswer(ctx, `<b>Возникла непредвиденная ошибка</b>`);
        }

    }
};
