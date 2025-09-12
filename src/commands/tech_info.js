module.exports = {
    name: 'tech_info',
    description: 'Техническая информация о боте',
    async execute(bot, ctx) {
        const text = `
        <b>🤖 Бот</b>
        • Разработчик: <a href="https://t.me/rpcotik">@rpcotik</a>
        • Версия бота: <code>v2.2.4</code>
        • Последнее обновление: <code>12.09.2025</code>

        <b>🌐 Сайт и API</b>
        • Сайт: <a href="https://schedule.rpcot.ru/schedule">schedule.rpcot.ru</a>
        • Версия сайта: <code>2.2.0</code>
        • Версия API: <code>2.2.0</code>
        • Последнее обновление: <code>08.09.2025</code>

        <b>🛠 Стек технологий</b>
        • Язык программирования: <code>JavaScript</code> (+ CSS, HTML)
        • Версия Node.js: <code>${process.version}</code>
        • База данных: <code>MySQL</code>

        <b>📂 Репозиторий</b>
        • https://github.com/rpcot/schedly
        `.replace(/  +/g, '');

        await ctx.reply(text, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
    }
};
