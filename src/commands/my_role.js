const { getDefaultPrefixes } = require("../utils/prefixes-functions");
const { getUserData } = require("../utils/users-functions");

module.exports = {
    name: 'my_role',
    description: 'Посмотреть свою роль в боте',
    async execute(bot, ctx) {

        const userdata = await getUserData(ctx.from.id);

        let prefix;
        if (userdata.prefix) {
            prefix = userdata.prefix;
        } else {
            const prefixes = getDefaultPrefixes();
            prefix = prefixes[userdata.group];
        }

        const mention = (ctx.from.username)
            ? `@${ctx.from.username}`
            : `${ctx.from.first_name} ${ctx.from.last_name}`;

        await ctx.reply(`${mention}, твоя роль: <b>${prefix}</b>`, {
            parse_mode: 'HTML',
        });

    }
};
