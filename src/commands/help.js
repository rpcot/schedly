const { Keyboard } = require("grammy");
const { getUserData, getGeneralMenuKeyboard } = require("../utils/users-functions");

module.exports = {
    name: 'help',
    description: 'Посмотреть список команд',
    hide: false,
    async execute(bot, ctx) {

        let text = `<b>📝 Общие</b>
        • <b>/help</b> - Посмотреть список команд
        • <b>/site</b> - Получить ссылку на сайт

        <b>📅 Расписание</b>
        • <b>/today</b> - Посмотреть расписание на сегодня
        • <b>/tomorrow</b> - Посмотреть расписание на завтра

        <b>💖 Обратная связь</b>
        • <b>/feedback</b> - Отправить сообщение разработчику

        <b>🛠️ Административные</b>
        `.replace(/  +/g, '');

        const keyboard = await getGeneralMenuKeyboard(ctx.from.id);

        const userdata = await getUserData(ctx.from.id);

        if (userdata.group === 'admin' || userdata.group === 'developer') {
            text += `• <b>/manage</b> - Управление расписанием
            • <b>/how_to_use</b> - Как пользоваться ботом
            `.replace(/  +/g, '');
        } else {
            text += `• <b>/go_admin</b> - Отправить запрос на получение админ прав`;
        }

        if (userdata.group === 'developer') {
            text += `\n<b>💻 Разработчик</b>
            • <b>/set_prefix</b> - Установить роль пользователю
            • <b>/user_manage</b> - Управление пользователем
            `.replace(/  +/g, '');
        }

        await ctx.reply(text, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
        });

    }
};
