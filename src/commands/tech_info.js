module.exports = {
    name: 'tech_info',
    description: 'Техническая информация о боте',
    async execute(bot, ctx) {
        const text = `<b>💡 Разработчик</b>
        • <a href="https://t.me/rpcotik">@rpcotik</a>

        <b>🤖 Бот</b>
        • Бот: <a href="https://t.me/raspisssanie_bot">SCHEDLY</a>
        • Версия бота: <code>v2.5.0</code>
        • Последнее обновление: <code>20.10.2025</code>

        <b>🌐 Сайт</b>
        • Сайт: <a href="https://schedule.rpcot.ru/schedule">schedule.rpcot.ru</a>
        • Версия сайта: <code>v2.4.0</code>
        • Последнее обновление: <code>30.09.2025</code>
        
        <b>🧩 API</b>
        • API: <a href="https://api.schedule.rpcot.ru">api.schedule.rpcot.ru</a>
        • Версия API: <code>v2.2.2</code>
        • Последнее обновление: <code>08.10.2025</code>

        <b>🛠 Стек технологий</b>
        • Язык программирования: <code>JavaScript</code> (+ CSS, HTML)
        • Версия Node.js: <code>${process.version}</code>
        • База данных: <code>MySQL</code>

        <b>📂 GitHub</b>
        • https://github.com/rpcot/schedly
        `.replace(/  +/g, '');

        await ctx.reply(text, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
    }
};
